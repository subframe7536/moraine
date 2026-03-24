import { createSignal } from 'solid-js'
import * as v from 'valibot'

import {
  Button,
  Checkbox,
  CheckboxGroup,
  Form,
  FormField,
  Input,
  RadioGroup,
  Select,
  Switch,
  Textarea,
} from '../../../src'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

function WorkspaceProvisioning() {
  const [workspaceState, setWorkspaceState] = createSignal({
    workspaceName: '',
    ownerEmail: '',
    role: 'developer' as string | null,
    environment: 'staging',
    enableAudit: true,
  })

  const updateWorkspace = (field: string, value: string | boolean | null) => {
    setWorkspaceState((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Form
      state={workspaceState()}
      validate={(state) => {
        const errors: { name: string; message: string }[] = []

        if (!state?.workspaceName?.trim()) {
          errors.push({ name: 'workspaceName', message: 'Workspace name is required.' })
        }

        if (!state?.ownerEmail?.trim()) {
          errors.push({ name: 'ownerEmail', message: 'Owner email is required.' })
        } else if (!state.ownerEmail.includes('@')) {
          errors.push({ name: 'ownerEmail', message: 'Enter a valid owner email.' })
        }

        if (!state?.role) {
          errors.push({ name: 'role', message: 'Select a default role.' })
        }

        return errors
      }}
      classes={{ root: 'mx-auto max-w-2xl w-full space-y-4' }}
    >
      <FormField name="workspaceName" label="Workspace Name" required>
        <Input
          value={workspaceState().workspaceName}
          onValueChange={(v) => updateWorkspace('workspaceName', String(v))}
          placeholder="acme-platform"
        />
      </FormField>

      <FormField name="ownerEmail" label="Owner Email" required>
        <Input
          type="email"
          value={workspaceState().ownerEmail}
          onValueChange={(v) => updateWorkspace('ownerEmail', String(v))}
          placeholder="owner@acme.dev"
        />
      </FormField>

      <FormField name="role" label="Default Team Role" required>
        <Select
          options={[
            { label: 'Developer', value: 'developer' },
            { label: 'Designer', value: 'designer' },
            { label: 'Manager', value: 'manager' },
          ]}
          value={workspaceState().role}
          onChange={(v) => updateWorkspace('role', v as string | null)}
          placeholder="Select role"
        />
      </FormField>

      <FormField name="environment" label="Initial Deployment Target" required>
        <RadioGroup
          items={[
            {
              value: 'staging',
              label: 'Staging',
              description: 'Pre-production verification',
            },
            {
              value: 'production',
              label: 'Production',
              description: 'Public traffic rollout',
            },
          ]}
          variant="table"
          value={workspaceState().environment}
          onChange={(v) => updateWorkspace('environment', String(v))}
        />
      </FormField>

      <FormField
        name="enableAudit"
        label="Audit Logging"
        description="Enable immutable audit trail for permissions and deploy actions."
      >
        <Switch
          checked={workspaceState().enableAudit}
          onChange={(v) => updateWorkspace('enableAudit', Boolean(v))}
          checkedIcon="i-lucide-shield-check"
          uncheckedIcon="i-lucide-shield"
        />
      </FormField>

      <Button type="submit">Create Workspace</Button>
    </Form>
  )
}

function ReleaseReadinessChecklist() {
  return (
    <Form
      schema={v.object({
        releaseVersion: v.pipe(v.string(), v.minLength(1, 'Release version is required.')),
        channels: v.pipe(v.array(v.string()), v.nonEmpty('Select at least one release channel.')),
        approvalLevel: v.picklist(['peer', 'lead', 'qa'], 'Select an approval gate.'),
        rolloutConfirmed: v.pipe(
          v.boolean(),
          v.value(true, 'You must confirm rollback readiness.'),
        ),
        notes: v.pipe(v.string(), v.minLength(10, 'Add at least 10 characters of release notes.')),
      })}
      classes={{ root: 'mx-auto max-w-2xl w-full space-y-4' }}
    >
      <FormField name="releaseVersion" label="Release Version" required>
        <Input placeholder="v2.14.0" />
      </FormField>

      <FormField name="channels" label="Rollout Channels" required>
        <CheckboxGroup
          items={[
            {
              value: 'alpha',
              label: 'Alpha',
              description: 'Internal team first',
            },
            {
              value: 'beta',
              label: 'Beta',
              description: 'Limited external users',
            },
            {
              value: 'stable',
              label: 'Stable',
              description: 'Full production release',
            },
          ]}
          variant="table"
        />
      </FormField>

      <FormField name="approvalLevel" label="Approval Gate" required>
        <RadioGroup
          items={[
            {
              value: 'peer',
              label: 'Peer Review',
              description: 'One teammate sign-off',
            },
            {
              value: 'lead',
              label: 'Tech Lead',
              description: 'Owner team approval',
            },
            {
              value: 'qa',
              label: 'QA + Lead',
              description: 'Formal release gate',
            },
          ]}
          variant="card"
        />
      </FormField>

      <FormField name="notes" label="Release Notes" required>
        <Textarea
          placeholder="Summarize risk, migration notes, and rollback strategy..."
          rows={4}
        />
      </FormField>

      <FormField name="rolloutConfirmed" label="Rollback Prepared" required>
        <Checkbox label="I confirmed rollback commands and owner on-call availability." />
      </FormField>

      <Button type="submit">Approve Release</Button>
    </Form>
  )
}

function IncidentEscalationPolicy() {
  const [incidentState, setIncidentState] = createSignal({
    policy: {
      name: '',
      severity: 'p1' as string | null,
      notifyEmail: '',
      autoRollback: true,
      summary: '',
    },
  })

  const updateIncident = (field: string, value: string | boolean | null) => {
    setIncidentState((prev) => ({
      ...prev,
      policy: {
        ...prev.policy,
        [field]: value,
      },
    }))
  }

  return (
    <Form
      state={incidentState()}
      schema={v.object({
        policy: v.object({
          name: v.pipe(v.string(), v.minLength(1, 'Policy name is required.')),
          severity: v.pipe(v.string(), v.minLength(1, 'Severity is required.')),
          notifyEmail: v.pipe(
            v.string(),
            v.minLength(1, 'Notify email is required.'),
            v.email('Enter a valid notify email.'),
          ),
          autoRollback: v.boolean(),
          summary: v.pipe(
            v.string(),
            v.minLength(12, 'Summary should explain when this policy applies.'),
          ),
        }),
      })}
      classes={{ root: 'mx-auto max-w-2xl w-full space-y-4' }}
    >
      <FormField name={['policy', 'name']} label="Policy Name" required>
        <Input
          value={incidentState().policy.name}
          onValueChange={(v) => updateIncident('name', String(v))}
          placeholder="payments-latency-spike"
        />
      </FormField>

      <FormField name={['policy', 'severity']} label="Default Severity" required>
        <Select
          options={[
            { label: 'P1 - Critical', value: 'p1' },
            { label: 'P2 - Major', value: 'p2' },
            { label: 'P3 - Minor', value: 'p3' },
          ]}
          value={incidentState().policy.severity}
          onChange={(v) => updateIncident('severity', v as string | null)}
          placeholder="Select severity"
        />
      </FormField>

      <FormField name={['policy', 'notifyEmail']} label="Escalation Email" required>
        <Input
          type="email"
          value={incidentState().policy.notifyEmail}
          onValueChange={(v) => updateIncident('notifyEmail', String(v))}
          placeholder="oncall@acme.dev"
        />
      </FormField>

      <FormField
        name={['policy', 'autoRollback']}
        label="Auto Rollback"
        description="Trigger rollback when alert duration crosses the policy threshold."
      >
        <Switch
          checked={incidentState().policy.autoRollback}
          onChange={(v) => updateIncident('autoRollback', Boolean(v))}
        />
      </FormField>

      <FormField name={['policy', 'summary']} label="Policy Summary" required>
        <Textarea
          value={incidentState().policy.summary}
          onValueChange={(v) => updateIncident('summary', String(v))}
          placeholder="Describe conditions and handoff details for incident response."
          rows={3}
        />
      </FormField>

      <Button type="submit">Save Escalation Policy</Button>
    </Form>
  )
}

function AccessRequestReview() {
  const [accessState, setAccessState] = createSignal({
    requester: '',
    reason: '',
    temporary: true,
    scopes: ['repo:read'],
    reviewers: ['security'],
  })

  const updateAccess = (field: string, value: string | boolean | string[]) => {
    setAccessState((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Form
      state={accessState()}
      validate={(state) => {
        const errors: { name: string; message: string }[] = []

        if (!state?.requester?.trim()) {
          errors.push({ name: 'requester', message: 'Requester is required.' })
        }

        if (!state?.reason?.trim()) {
          errors.push({ name: 'reason', message: 'Business reason is required.' })
        }

        if (!state?.scopes || state.scopes.length === 0) {
          errors.push({ name: 'scopes', message: 'Select at least one permission scope.' })
        }

        if (!state?.reviewers || state.reviewers.length === 0) {
          errors.push({ name: 'reviewers', message: 'Select at least one reviewer.' })
        }

        return errors
      }}
      classes={{ root: 'mx-auto max-w-2xl w-full space-y-4' }}
    >
      <FormField name="requester" label="Requester" required>
        <Input
          value={accessState().requester}
          onValueChange={(v) => updateAccess('requester', String(v))}
          placeholder="alex.chen"
        />
      </FormField>

      <FormField name="reason" label="Business Reason" required>
        <Textarea
          value={accessState().reason}
          onValueChange={(v) => updateAccess('reason', String(v))}
          placeholder="Need short-term access for production incident mitigation."
          rows={3}
        />
      </FormField>

      <FormField
        name="temporary"
        label="Temporary Access"
        description="Enable automatic expiry for this permission grant."
      >
        <Switch
          checked={accessState().temporary}
          onChange={(v) => updateAccess('temporary', Boolean(v))}
        />
      </FormField>

      <FormField name="scopes" label="Requested Scopes" required>
        <CheckboxGroup
          items={[
            {
              value: 'repo:read',
              label: 'Repository Read',
              description: 'View code and PRs',
            },
            {
              value: 'repo:write',
              label: 'Repository Write',
              description: 'Push and merge changes',
            },
            {
              value: 'deploy:prod',
              label: 'Production Deploy',
              description: 'Trigger release pipelines',
            },
          ]}
          value={accessState().scopes}
          onChange={(v) => updateAccess('scopes', v)}
          variant="card"
        />
      </FormField>

      <FormField name="reviewers" label="Required Reviewers" required>
        <CheckboxGroup
          items={[
            {
              value: 'security',
              label: 'Security Team',
              description: 'Permission boundary review',
            },
            {
              value: 'platform',
              label: 'Platform Team',
              description: 'Infrastructure and ops review',
            },
            {
              value: 'manager',
              label: 'Line Manager',
              description: 'Business ownership approval',
            },
          ]}
          value={accessState().reviewers}
          onChange={(v) => updateAccess('reviewers', v)}
        />
      </FormField>

      <Button type="submit">Submit Access Request</Button>
    </Form>
  )
}

export default () => {
  return (
    <DemoPage componentKey="form" extraApiKeys={['form-field']}>
      <DemoSection
        title="Workspace Provisioning"
        description="Create a new workspace with owner identity, default role, and rollout target."
        demo={WorkspaceProvisioning}
      />

      <DemoSection
        title="Release Readiness Checklist"
        description="Validate release metadata, rollout channels, and approval gate before deployment."
        demo={ReleaseReadinessChecklist}
      />

      <DemoSection
        title="Incident Escalation Policy"
        description="Configure nested policy fields for severity routing and automatic rollback behavior."
        demo={IncidentEscalationPolicy}
      />

      <DemoSection
        title="Access Request Review"
        description="Review temporary access requests with scoped permissions and required reviewers."
        demo={AccessRequestReview}
      />
    </DemoPage>
  )
}
