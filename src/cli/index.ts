#!/usr/bin/env node
import { Command } from 'commander';
import { providers } from '../providers/registry.js';
import { getCredential, saveCredential, deleteCredential, listConnected } from '../store/keychain.js';
import { listProjects, getEnvContent, exportProject } from '../store/projects.js';
import { getProvider } from '../providers/registry.js';
import { logAudit } from '../store/audit.js';
import { createProject, writeEnv, type ProjectService } from '../store/projects.js';

const program = new Command();

program
  .name('keyforge')
  .description('Local-first developer key management tool')
  .version('1.0.0');

// keyforge status
program
  .command('status')
  .description('Show connection status of all providers')
  .action(async () => {
    const connected = await listConnected();
    console.log('\n  KeyForge Status\n');
    for (const p of providers) {
      const isConn = connected.includes(p.id);
      const symbol = isConn ? '●' : '○';
      const status = isConn ? 'connected' : 'not connected';
      const cred = isConn ? await getCredential(p.id) : null;
      const detail = cred?.account || '';
      console.log(`  ${p.name.padEnd(14)} ${symbol} ${status.padEnd(16)} ${detail}`);
    }
    console.log('');
  });

// keyforge connect <providerId>
program
  .command('connect <providerId>')
  .description('Connect a provider interactively')
  .action(async (providerId: string) => {
    const provider = getProvider(providerId);
    if (!provider) {
      console.error(`Unknown provider: ${providerId}`);
      console.error(`Available: ${providers.map((p) => p.id).join(', ')}`);
      process.exit(1);
    }

    const clack = await import('@clack/prompts');
    clack.intro(`Connect ${provider.name}`);

    const creds: Record<string, string> = {};
    for (const field of provider.credentialFields) {
      const value = await clack.text({
        message: field.label,
        placeholder: field.placeholder,
        validate: (v) => (v.length === 0 ? 'Required' : undefined),
      });
      if (clack.isCancel(value)) { clack.cancel('Cancelled'); process.exit(0); }
      creds[field.key] = value as string;
    }

    const spinner = clack.spinner();
    spinner.start('Validating...');
    const result = await provider.validateCredential(creds);
    if (!result.valid) {
      spinner.stop('Failed');
      console.error(`  Error: ${result.error}`);
      process.exit(1);
    }
    spinner.stop('Valid!');

    await saveCredential(providerId, {
      credentials: creds,
      account: result.account,
      connectedAt: new Date().toISOString(),
      metadata: result.metadata,
    });
    logAudit({ event: 'provider_connected', providerId });
    clack.outro(`Connected to ${provider.name}${result.account ? ` (${result.account})` : ''}`);
  });

// keyforge disconnect <providerId>
program
  .command('disconnect <providerId>')
  .description('Disconnect a provider')
  .action(async (providerId: string) => {
    const provider = getProvider(providerId);
    if (!provider) {
      console.error(`Unknown provider: ${providerId}`);
      process.exit(1);
    }

    const stored = await getCredential(providerId);
    if (!stored) {
      console.log(`${provider.name} is not connected.`);
      return;
    }

    await deleteCredential(providerId);
    logAudit({ event: 'provider_disconnected', providerId });
    console.log(`Disconnected ${provider.name}.`);
  });

// keyforge new <projectName>
program
  .command('new <projectName>')
  .description('Create a new project with API keys')
  .option('-s, --services <services>', 'Comma-separated provider IDs')
  .action(async (projectName: string, opts: { services?: string }) => {
    // Validate project name
    if (!/^[a-z0-9][a-z0-9-]{0,49}$/.test(projectName)) {
      console.error('Invalid project name. Use lowercase letters, numbers, and hyphens (1-50 chars).');
      process.exit(1);
    }

    const connected = await listConnected();
    if (connected.length === 0) {
      console.error('No providers connected. Run: keyforge connect <provider>');
      process.exit(1);
    }

    let selectedIds: string[];
    if (opts.services) {
      selectedIds = opts.services.split(',').map((s) => s.trim());
      // Validate all selected services are connected
      for (const id of selectedIds) {
        if (!connected.includes(id)) {
          console.error(`${id} is not connected. Run: keyforge connect ${id}`);
          process.exit(1);
        }
      }
    } else {
      const clack = await import('@clack/prompts');
      const choices = connected.map((id) => {
        const p = getProvider(id)!;
        const method = p.canCreateKeys ? '(creates key)' : '(copies key)';
        return { value: id, label: `${p.name} ${method}` };
      });
      const result = await clack.multiselect({ message: 'Select services', options: choices });
      if (clack.isCancel(result)) { process.exit(0); }
      selectedIds = result as string[];
      if (selectedIds.length === 0) {
        console.error('No services selected.');
        process.exit(1);
      }
    }

    console.log(`\nProvisioning ${projectName}...\n`);
    const allKeys: Record<string, string> = {};
    const services: Record<string, ProjectService> = {};
    let errorCount = 0;

    for (const providerId of selectedIds) {
      const provider = getProvider(providerId);
      if (!provider) { console.error(`  ✗ Unknown: ${providerId}`); errorCount++; continue; }
      const stored = await getCredential(providerId);
      if (!stored) { console.error(`  ✗ ${provider.name}: not connected`); errorCount++; continue; }

      try {
        if (provider.canCreateKeys && provider.createKey) {
          const mergedCreds = { ...stored.credentials };
          if (stored.metadata) {
            for (const [k, v] of Object.entries(stored.metadata)) mergedCreds[`_${k}`] = v;
          }
          process.stdout.write(`  ⟳ ${provider.name}: creating key...`);
          const result = await provider.createKey(projectName, mergedCreds);
          Object.assign(allKeys, result.keys);
          services[providerId] = { method: 'api', keyId: result.keyId, envVars: Object.keys(result.keys) };
          logAudit({ event: 'key_created', providerId, projectName });
          console.log(`\r  ✓ ${provider.name}: key created`);
        } else {
          const envMap: Record<string, string> = {};
          for (let i = 0; i < provider.envVars.length; i++) {
            const field = provider.credentialFields[i];
            if (field && stored.credentials[field.key]) {
              envMap[provider.envVars[i]] = stored.credentials[field.key];
            }
          }
          if (Object.keys(envMap).length === 0) {
            console.error(`  ✗ ${provider.name}: no credentials to copy`);
            errorCount++;
            continue;
          }
          Object.assign(allKeys, envMap);
          services[providerId] = { method: 'copy', envVars: Object.keys(envMap) };
          logAudit({ event: 'key_copied', providerId, projectName });
          console.log(`  ✓ ${provider.name}: key copied`);
        }
      } catch (e) {
        console.error(`  ✗ ${provider.name}: ${(e as Error).message}`);
        errorCount++;
      }
    }

    if (Object.keys(allKeys).length === 0) {
      console.error('\nAll providers failed. No project created.');
      process.exit(1);
    }

    createProject(projectName, services);
    writeEnv(projectName, allKeys);
    logAudit({ event: 'project_created', projectName });

    console.log(`\n  Project "${projectName}" created!\n`);
    for (const [k, v] of Object.entries(allKeys)) {
      const masked = v.length > 12 ? v.slice(0, 8) + '****' + v.slice(-4) : '****';
      console.log(`  ${k}=${masked}`);
    }
    if (errorCount > 0) {
      console.log(`\n  ${errorCount} service(s) failed — see errors above.`);
    }
    console.log(`\n  Export: keyforge export ${projectName} --to ./\n`);
  });

// keyforge projects
program
  .command('projects')
  .description('List all projects')
  .action(async () => {
    const projects = listProjects();
    if (projects.length === 0) { console.log('No projects found.'); return; }
    console.log('\n  Projects\n');
    for (const p of projects) {
      const svcCount = Object.keys(p.services).length;
      const date = new Date(p.createdAt).toLocaleDateString();
      const svcNames = Object.keys(p.services).join(', ');
      console.log(`  ${p.name.padEnd(25)} ${date.padEnd(14)} ${svcNames}`);
    }
    console.log('');
  });

// keyforge export <projectName>
program
  .command('export <projectName>')
  .description('Export .env file to a directory')
  .option('-t, --to <path>', 'Target directory', '.')
  .action(async (projectName: string, opts: { to: string }) => {
    try {
      exportProject(projectName, opts.to);
      logAudit({ event: 'project_exported', projectName });
      console.log(`Exported ${projectName} to ${opts.to}`);
    } catch (e) {
      console.error((e as Error).message);
      process.exit(1);
    }
  });

// keyforge revoke <projectName>
program
  .command('revoke <projectName>')
  .description('Revoke keys and delete a project')
  .action(async (projectName: string) => {
    const { getProject, deleteProject } = await import('../store/projects.js');
    const project = getProject(projectName);
    if (!project) { console.error(`Project "${projectName}" not found.`); process.exit(1); }

    console.log(`\nRevoking keys for "${projectName}"...\n`);

    for (const [providerId, svc] of Object.entries(project.services)) {
      const provider = getProvider(providerId);
      if (!provider) continue;
      if (provider.revokeKey && svc.keyId) {
        const stored = await getCredential(providerId);
        if (stored) {
          try {
            const mergedCreds = { ...stored.credentials };
            if (stored.metadata) {
              for (const [k, v] of Object.entries(stored.metadata)) mergedCreds[`_${k}`] = v;
            }
            await provider.revokeKey(svc.keyId, mergedCreds);
            logAudit({ event: 'key_revoked', providerId, projectName });
            console.log(`  ✓ ${provider.name}: key revoked`);
          } catch (e) {
            console.error(`  ✗ ${provider.name}: ${(e as Error).message}`);
          }
        } else {
          console.log(`  ⚠ ${provider.name}: provider disconnected, cannot revoke automatically`);
        }
      } else if (svc.method === 'copy') {
        console.log(`  ℹ ${provider.name}: copied key — revoke manually in their dashboard`);
      }
    }

    deleteProject(projectName);
    logAudit({ event: 'project_deleted', projectName });
    console.log(`\nProject "${projectName}" deleted.\n`);
  });

program.parse();
