import { XinyuanApiForm } from '@/components/onboarding/xinyuan-form'
import { Zap } from '@/lib/icons'

import { SectionHeading, SettingsContent } from './primitives'

/**
 * The entire API configuration surface of this build.
 *
 * Replaces the former Providers page (OAuth accounts + API-key catalog +
 * custom endpoints + local models) and the separate API Keys page. There is
 * exactly one endpoint and exactly one form — see xinyuan-form.tsx.
 */
export function XinyuanSettings({ onConfigSaved }: { onConfigSaved?: () => void }) {
  return (
    <SettingsContent>
      <div className="space-y-6">
        <section>
          <SectionHeading icon={Zap} title="Xinyuan API" />
          <div className="grid gap-3 rounded-md border border-border/50 p-3">
            <XinyuanApiForm onDone={onConfigSaved} />
          </div>
        </section>
      </div>
    </SettingsContent>
  )
}
