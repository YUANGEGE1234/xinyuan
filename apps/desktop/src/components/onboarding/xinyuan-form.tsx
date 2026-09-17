import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { activateCustomEndpoint, saveCustomEndpoint, validateProviderCredential } from '@/hermes'
import { Check, KeyRound, Loader2, Zap } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { notify, notifyError } from '@/store/notifications'
import { completeDesktopOnboarding, type OnboardingContext } from '@/store/onboarding'

/**
 * The single inference endpoint this build talks to.
 *
 * This fork deliberately ships ONE way to configure a model: paste the API key,
 * type the model name, done. The address is a constant rather than a field, so
 * there is nothing else to get wrong — every other provider surface (OAuth
 * accounts, the API-key catalog, local models, gateways) has been removed from
 * the UI. Keep this in sync with `XINYUAN_BASE_URL` in the backend config if the
 * endpoint ever moves.
 */
export const XINYUAN_BASE_URL = 'https://yuangeluyou.com/v1'
export const XINYUAN_ENDPOINT_ID = 'xinyuan'
const XINYUAN_ENDPOINT_NAME = 'Xinyuan'

interface XinyuanApiFormProps {
  /** Present in the first-run overlay, absent on the Settings surface. */
  ctx?: OnboardingContext
  /** Called after a successful connect, in addition to the onboarding hand-off. */
  onDone?: () => void
}

/**
 * Two fields, one button. Saves a `custom_providers` entry pointing at
 * XINYUAN_BASE_URL and activates it as the main model.
 *
 * "Fetch models" is a convenience only: it probes /v1/models so the model name
 * can be picked from a list instead of typed, but the user is free to type any
 * name — hosted aggregators serve model ids the probe cannot always enumerate.
 */
export function XinyuanApiForm({ ctx, onDone }: XinyuanApiFormProps) {
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('')
  const [discovered, setDiscovered] = useState<string[]>([])
  const [probing, setProbing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<null | string>(null)
  const [connected, setConnected] = useState(false)

  const key = apiKey.trim()
  const modelName = model.trim()
  const canSave = key.length > 0 && modelName.length > 0 && !saving

  async function fetchModels() {
    if (!key || probing) {
      return
    }

    setProbing(true)
    setError(null)

    try {
      const probe = await validateProviderCredential('OPENAI_BASE_URL', XINYUAN_BASE_URL, key)
      const models = probe.models ?? []

      if (models.length > 0) {
        setDiscovered(models)

        if (!modelName) {
          setModel(models[0])
        }

        notify({ kind: 'success', message: `连接成功，发现 ${models.length} 个模型。` })
      } else if (probe.reachable) {
        notify({ kind: 'warning', message: probe.message || '地址可达，但未返回模型列表，请手动填写模型名称。' })
      } else {
        setError(probe.message || '无法连接到该地址，请检查网络。')
      }
    } catch {
      setError('连接测试失败，请检查网络或 API 密钥。')
    } finally {
      setProbing(false)
    }
  }

  async function connect() {
    if (!canSave) {
      return
    }

    setSaving(true)
    setError(null)

    try {
      const saved = await saveCustomEndpoint({
        id: XINYUAN_ENDPOINT_ID,
        name: XINYUAN_ENDPOINT_NAME,
        base_url: XINYUAN_BASE_URL,
        model: modelName,
        api_key: key,
        discover_models: false,
        make_default: true
      })

      await activateCustomEndpoint(saved.id || XINYUAN_ENDPOINT_ID)

      // The backend caches env/config; ask it to re-read before the chat opens.
      await ctx?.requestGateway('reload.env').catch(() => undefined)

      setConnected(true)
      notify({ kind: 'success', message: `${XINYUAN_ENDPOINT_NAME} 已连接，可以开始使用了。` })

      if (ctx) {
        completeDesktopOnboarding()
        ctx.onCompleted?.()
      }

      onDone?.()
    } catch (err) {
      notifyError(err, '保存失败')
      setError('保存失败，请确认 API 密钥和模型名称是否正确。')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-1">
        <p className="text-sm text-muted-foreground">填写 API 密钥和模型名称即可开始使用。</p>
      </div>

      <label className="grid gap-1.5 text-xs text-muted-foreground">
        接口地址
        <div className="flex h-9 items-center rounded-md border border-border/50 bg-muted/40 px-3 font-mono text-xs text-foreground">
          {XINYUAN_BASE_URL}
        </div>
      </label>

      <label className="grid gap-1.5 text-xs text-muted-foreground">
        API 密钥
        <Input
          autoComplete="off"
          autoFocus
          className="font-mono"
          onChange={event => {
            setApiKey(event.target.value)
            setError(null)
          }}
          onKeyDown={event => {
            if (event.key === 'Enter') {
              void connect()
            }
          }}
          placeholder="sk-..."
          type="password"
          value={apiKey}
        />
      </label>

      <label className="grid gap-1.5 text-xs text-muted-foreground">
        模型名称
        <div className="flex items-center gap-2">
          <Input
            autoComplete="off"
            className="font-mono"
            list="xinyuan-models"
            onChange={event => {
              setModel(event.target.value)
              setError(null)
            }}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                void connect()
              }
            }}
            placeholder="例如 gpt-4o"
            value={model}
          />
          <Button
            className="shrink-0"
            disabled={!key || probing || saving}
            onClick={() => void fetchModels()}
            size="sm"
            type="button"
            variant="outline"
          >
            {probing ? <Loader2 className="animate-spin" /> : <Zap />}
            获取模型
          </Button>
        </div>
        <datalist id="xinyuan-models">
          {discovered.map(name => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </label>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      <div className="flex items-center gap-3">
        <Button disabled={!canSave} onClick={() => void connect()}>
          {saving ? <Loader2 className="animate-spin" /> : connected ? <Check /> : <KeyRound />}
          {saving ? '正在连接…' : connected ? '已连接' : '保存并使用'}
        </Button>
        {connected ? (
          <span className={cn('inline-flex items-center gap-1 text-xs text-muted-foreground')}>
            <Check className="size-3" />
            {XINYUAN_ENDPOINT_NAME}
          </span>
        ) : null}
      </div>
    </div>
  )
}
