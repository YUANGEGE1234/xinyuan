import { useCallback, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  activateCustomEndpoint,
  deleteCustomEndpoint,
  getCustomEndpoints,
  saveCustomEndpoint,
  validateProviderCredential
} from '@/hermes'
import { Check, KeyRound, Loader2, Pencil, Plus, Trash2, X, Zap } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { notify, notifyError } from '@/store/notifications'
import { completeDesktopOnboarding, type OnboardingContext } from '@/store/onboarding'
import type { CustomEndpoint } from '@/types/hermes'

/**
 * The default inference address this build ships with.
 *
 * Pre-filled and normally left alone; the "修改" disclosure exposes it for the
 * small number of users who point the app at their own OpenAI-compatible
 * gateway. Keep in sync with the `providers.xinyuan` block documented in the
 * shipped data/config.yaml.
 */
export const XINYUAN_BASE_URL = 'https://yuangeluyou.com/v1'
/** Legacy id used by the single-endpoint builds before 0.23.0. Kept so an
 * existing config is still listed (and can be edited/deleted) after upgrade. */
export const XINYUAN_ENDPOINT_ID = 'xinyuan'

/** Trim, drop trailing slashes and reject anything that is not an http(s) URL. */
function normaliseBaseUrl(raw: string): null | string {
  const value = raw.trim().replace(/\/+$/, '')

  if (!value) {
    return null
  }

  try {
    const url = new URL(value)

    return url.protocol === 'http:' || url.protocol === 'https:' ? value : null
  } catch {
    return null
  }
}

/** Every API key gets its OWN endpoint id. The old build hard-coded one id,
 * which is why saving a second key silently overwrote the first one. */
function makeEndpointId(): string {
  return `xinyuan-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function uniqueModels(names: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const raw of names) {
    const name = raw.trim()
    if (name && !seen.has(name)) {
      seen.add(name)
      result.push(name)
    }
  }
  return result
}

interface XinyuanApiFormProps {
  /** Present in the first-run overlay, absent on the Settings surface. */
  ctx?: OnboardingContext
  /** Called after a successful connect, in addition to the onboarding hand-off. */
  onDone?: () => void
}

/**
 * Multiple API keys, each with multiple models.
 *
 * Upstream's custom-endpoint API already supports `models: string[]` and
 * addresses entries by id. The previous build shipped a hard-coded id plus a
 * single `model` string, so every save replaced the only entry — the reported
 * "can only add one model" bug. This form keeps one entry per API key, stores
 * the full model catalogue in `models`, and activates a chosen model on click.
 */
export function XinyuanApiForm({ ctx, onDone }: XinyuanApiFormProps) {
  const [endpoints, setEndpoints] = useState<CustomEndpoint[]>([])
  const [current, setCurrent] = useState<{ model: string; provider: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const [showForm, setShowForm] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState(XINYUAN_BASE_URL)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [modelDraft, setModelDraft] = useState('')
  const [models, setModels] = useState<string[]>([])
  const [discovered, setDiscovered] = useState<string[]>([])
  const [probing, setProbing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<null | string>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await getCustomEndpoints()
      setEndpoints(res.endpoints ?? [])
      setCurrent(res.current ?? null)
    } catch {
      // The panel is still usable when the backend has no endpoints yet.
      setEndpoints([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const key = apiKey.trim()
  const endpoint = normaliseBaseUrl(baseUrl)
  const canSave = key.length > 0 && models.length > 0 && endpoint !== null && !saving

  function addModel(raw: string) {
    const next = uniqueModels([...models, raw])
    if (next.length === models.length) {
      return
    }
    setModels(next)
    setModelDraft('')
    setError(null)
  }

  function resetForm() {
    setEditingId(null)
    setName('')
    setApiKey('')
    setBaseUrl(XINYUAN_BASE_URL)
    setModelDraft('')
    setModels([])
    setDiscovered([])
    setShowAdvanced(false)
    setError(null)
    setShowForm(true)
  }

  async function fetchModels() {
    if (!key || !endpoint || probing) {
      return
    }

    setProbing(true)
    setError(null)

    try {
      const probe = await validateProviderCredential('OPENAI_BASE_URL', endpoint, key)
      const found = probe.models ?? []

      if (found.length > 0) {
        setDiscovered(found)
        setModels(previous => uniqueModels([...previous, ...found]))
        notify({ kind: 'success', message: `连接成功，已加入 ${found.length} 个模型。` })
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

  async function save() {
    if (!canSave || !endpoint) {
      return
    }

    setSaving(true)
    setError(null)

    try {
      const id = editingId ?? makeEndpointId()
      // Editing rewrites the entry (so models can be removed as well as added).
      // The upstream save endpoint MERGES model lists, so a delete+recreate is
      // required for a faithful edit. That drops the stored credential, which
      // is why the form asks for the key again when editing.
      if (editingId) {
        await deleteCustomEndpoint(editingId)
      }

      const saved = await saveCustomEndpoint({
        id,
        name: name.trim() || `接口 ${endpoints.length + 1}`,
        base_url: endpoint,
        model: models[0],
        models,
        api_key: key,
        discover_models: false,
        make_default: !editingId && endpoints.length === 0
      })

      await activateCustomEndpoint(saved.id || id)
      await ctx?.requestGateway('reload.env').catch(() => undefined)

      await refresh()
      resetForm()
      setShowForm(false)
      notify({ kind: 'success', message: `已保存 ${models.length} 个模型，可以开始使用了。` })

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

  async function useModel(ep: CustomEndpoint, model: string) {
    setBusyId(ep.id)
    setError(null)
    try {
      // No `api_key` in this payload: the backend keeps the stored credential
      // when the field is absent (an empty string would CLEAR it).
      await saveCustomEndpoint({
        id: ep.id,
        name: ep.name,
        base_url: ep.base_url,
        model,
        models: ep.models?.length ? ep.models : [model],
        discover_models: false
      })
      await activateCustomEndpoint(ep.id)
      await ctx?.requestGateway('reload.env').catch(() => undefined)
      await refresh()
      notify({ kind: 'success', message: `已切换到 ${model}` })
      onDone?.()
    } catch (err) {
      notifyError(err, '切换失败')
      setError('切换模型失败，请重试或重新保存该配置。')
    } finally {
      setBusyId(null)
    }
  }

  async function remove(ep: CustomEndpoint) {
    if (!window.confirm(`确定删除「${ep.name}」及其 ${ep.models?.length ?? 0} 个模型吗？`)) {
      return
    }
    setBusyId(ep.id)
    try {
      await deleteCustomEndpoint(ep.id)
      await refresh()
      notify({ kind: 'success', message: '配置已删除。' })
    } catch (err) {
      notifyError(err, '删除失败')
    } finally {
      setBusyId(null)
    }
  }

  function edit(ep: CustomEndpoint) {
    setEditingId(ep.id)
    setName(ep.name)
    setBaseUrl(ep.base_url)
    setModels(uniqueModels(ep.models?.length ? ep.models : [ep.model]))
    setApiKey('')
    setModelDraft('')
    setDiscovered([])
    setError(null)
    setShowAdvanced(ep.base_url !== XINYUAN_BASE_URL)
    setShowForm(true)
  }

  return (
    <div className="grid gap-5">
      {/* ---- saved configurations ------------------------------------- */}
      <section className="grid gap-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">已保存的接口配置（{endpoints.length}）</p>
          <Button
            onClick={() => (showForm && !editingId ? setShowForm(false) : resetForm())}
            size="sm"
            type="button"
            variant="outline"
          >
            <Plus />
            {showForm && !editingId ? '收起' : '添加配置'}
          </Button>
        </div>

        {loading ? (
          <p className="text-xs text-muted-foreground">正在读取配置…</p>
        ) : endpoints.length === 0 ? (
          <p className="rounded-md border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
            还没有配置。填写下方表单添加第一个 API 密钥；之后可以继续添加更多密钥，每个密钥都能配多个模型。
          </p>
        ) : (
          <div className="grid gap-2">
            {endpoints.map(ep => {
              const list = uniqueModels(ep.models?.length ? ep.models : [ep.model])
              const isCurrent = ep.is_current === true
              return (
                <div className="grid gap-2 rounded-md border border-border/50 p-3" key={ep.id}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="grid gap-0.5">
                      <span className="flex items-center gap-1.5 text-sm font-medium">
                        {ep.name}
                        {isCurrent ? (
                          <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[0.625rem] text-primary">
                            <Check className="size-3" /> 使用中
                          </span>
                        ) : null}
                      </span>
                      <span className="font-mono text-[0.6875rem] text-muted-foreground">{ep.base_url}</span>
                      {ep.api_key_preview ? (
                        <span className="font-mono text-[0.6875rem] text-muted-foreground">
                          密钥 {ep.api_key_preview}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        aria-label="编辑"
                        disabled={busyId === ep.id}
                        onClick={() => edit(ep)}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <Pencil />
                      </Button>
                      <Button
                        aria-label="删除"
                        disabled={busyId === ep.id}
                        onClick={() => void remove(ep)}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        {busyId === ep.id ? <Loader2 className="animate-spin" /> : <Trash2 />}
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {list.map(model => {
                      const active = isCurrent && current?.model === model
                      return (
                        <button
                          className={cn(
                            'rounded border px-2 py-1 font-mono text-[0.6875rem] transition-colors',
                            active
                              ? 'border-primary/50 bg-primary/10 text-primary'
                              : 'border-border/60 text-muted-foreground hover:border-foreground/40 hover:text-foreground'
                          )}
                          disabled={busyId === ep.id}
                          key={model}
                          onClick={() => void useModel(ep, model)}
                          title={`切换到 ${model}`}
                          type="button"
                        >
                          {active ? <Check className="mr-1 inline size-3" /> : null}
                          {model}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-[0.6875rem] text-muted-foreground">点击模型名即可切换当前使用的模型。</p>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ---- add / edit form ------------------------------------------- */}
      {showForm ? (
        <section className="grid gap-4 rounded-md border border-border/50 p-3">
          <p className="text-sm font-medium">{editingId ? '编辑配置' : '添加配置'}</p>
          {editingId ? (
            <p className="text-xs text-amber-600">
              编辑会重建该配置，请重新填写 API 密钥；模型列表可以增删。
            </p>
          ) : null}

          <label className="grid gap-1.5 text-xs text-muted-foreground">
            <span className="flex items-center justify-between gap-2">
              接口地址
              <button
                className="text-[0.6875rem] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                onClick={() => {
                  setShowAdvanced(value => !value)
                  setError(null)
                }}
                type="button"
              >
                {showAdvanced ? '收起' : '修改'}
              </button>
            </span>
            {showAdvanced ? (
              <Input
                autoComplete="off"
                className="font-mono"
                onChange={event => {
                  setBaseUrl(event.target.value)
                  setError(null)
                }}
                placeholder={XINYUAN_BASE_URL}
                value={baseUrl}
              />
            ) : (
              <div className="flex h-9 items-center rounded-md border border-border/50 bg-muted/40 px-3 font-mono text-xs text-foreground">
                {baseUrl.trim() || XINYUAN_BASE_URL}
              </div>
            )}
            {showAdvanced && !endpoint ? (
              <span className="text-destructive">请输入以 http:// 或 https:// 开头的完整地址。</span>
            ) : null}
          </label>

          <label className="grid gap-1.5 text-xs text-muted-foreground">
            配置名称（可选，用于区分不同密钥）
            <Input
              autoComplete="off"
              onChange={event => setName(event.target.value)}
              placeholder={`例如 接口 ${endpoints.length + 1}`}
              value={name}
            />
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
                if (event.key === 'Enter' && canSave) {
                  void save()
                }
              }}
              placeholder="sk-..."
              type="password"
              value={apiKey}
            />
          </label>

          <label className="grid gap-1.5 text-xs text-muted-foreground">
            模型名称（可添加多个）
            <div className="flex items-center gap-2">
              <Input
                autoComplete="off"
                className="font-mono"
                list="xinyuan-models"
                onChange={event => {
                  setModelDraft(event.target.value)
                  setError(null)
                }}
                onKeyDown={event => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    addModel(modelDraft)
                  }
                }}
                placeholder="例如 gpt-4o，回车添加"
                value={modelDraft}
              />
              <Button
                className="shrink-0"
                disabled={!modelDraft.trim()}
                onClick={() => addModel(modelDraft)}
                size="sm"
                type="button"
                variant="outline"
              >
                <Plus />
                添加
              </Button>
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
              {discovered.map(item => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </label>

          {discovered.length > 0 ? (
            <div className="grid gap-1.5">
              <p className="text-[0.6875rem] text-muted-foreground">该地址返回的模型（点击加入）：</p>
              <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
                {discovered.map(item => (
                  <button
                    className="rounded border border-border/60 px-2 py-0.5 font-mono text-[0.6875rem] text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                    key={item}
                    onClick={() => addModel(item)}
                    type="button"
                  >
                    + {item}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {models.length > 0 ? (
            <div className="grid gap-1.5">
              <p className="text-[0.6875rem] text-muted-foreground">本次将保存 {models.length} 个模型：</p>
              <div className="flex flex-wrap gap-1.5">
                {models.map(item => (
                  <span
                    className="inline-flex items-center gap-1 rounded border border-primary/30 bg-primary/5 px-2 py-1 font-mono text-[0.6875rem]"
                    key={item}
                  >
                    {item}
                    <button
                      aria-label={`移除 ${item}`}
                      onClick={() => setModels(previous => previous.filter(value => value !== item))}
                      type="button"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {error ? <p className="text-xs text-destructive">{error}</p> : null}

          <div className="flex items-center gap-3">
            <Button disabled={!canSave} onClick={() => void save()}>
              {saving ? <Loader2 className="animate-spin" /> : <KeyRound />}
              {saving ? '正在保存…' : editingId ? '保存修改' : '保存并使用'}
            </Button>
            <span className="text-[0.6875rem] text-muted-foreground">
              {models.length > 0 ? `将保存 ${models.length} 个模型` : '至少添加一个模型'}
            </span>
          </div>
        </section>
      ) : null}
    </div>
  )
}
