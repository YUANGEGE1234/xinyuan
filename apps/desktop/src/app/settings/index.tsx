import { useStore } from '@nanostores/react'
import { type ComponentType, useCallback, useEffect, useMemo, useRef } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'

import { KbdCombo } from '@/components/ui/kbd'
import { Tip } from '@/components/ui/tooltip'
import { getHermesConfigDefaults, getHermesConfigRecord, saveHermesConfig } from '@/hermes'
import { useI18n } from '@/i18n'
import { triggerHaptic } from '@/lib/haptics'
import {
  Archive,
  BarChart3,
  Bell,
  Download,
  Globe,
  Info,
  Keyboard,
  RefreshCw,
  Search,
  ShieldLock,
  Upload,
  Zap
} from '@/lib/icons'
import { isEditableTarget } from '@/lib/keybinds/combo'
import { typeToFocusChar } from '@/lib/keybinds/composer-focus-keys'
import { cn } from '@/lib/utils'
import { $commandPaletteOpen, openCommandPalettePage } from '@/store/command-palette'
import { confirm } from '@/store/confirm'
import { $activeConnectionId } from '@/store/connections'
import { recordFeatureUse, settingsArea } from '@/store/desktop-metrics'
import { bindingsFor } from '@/store/keybinds'
import { notifyError } from '@/store/notifications'
import { $settingsScopeProfile } from '@/store/settings-scope'

import { useRouteEnumParam } from '../hooks/use-route-enum-param'
import { OverlayIconButton } from '../overlays/overlay-chrome'
import { OverlayMain, OverlayNav, type OverlayNavGroup, OverlaySplitLayout } from '../overlays/overlay-split-layout'
import { OverlayView } from '../overlays/overlay-view'

import { AboutSettings } from './about-settings'
import { AppearanceSettings } from './appearance-settings'
import { BILLING_VIEWS, BillingSettings, type BillingSubView } from './billing'
import { deriveBillingView, useBillingState, useSubscriptionState } from './billing/use-billing-state'
import { ConfigSettings } from './config-settings'
import { SECTIONS } from './constants'
import { GatewaySettings } from './gateway-settings'
import { KeybindSettings } from './keybind-settings'
import { movedSettingsTabRedirect } from './moved-tabs'
import { NotificationsSettings } from './notifications-settings'
import {
  PAGE_SCOPED_PARAMS,
  PLUGINS_NAV_ICON,
  pluginSettingsNavChildren,
  PluginSettingsPane,
  usePluginSettingsRoute
} from './plugin-settings'
import { SettingsBreadcrumbContext } from './primitives'
import { SessionsSettings } from './sessions-settings'
import { SettingsSubpageHeader } from './subpage-navigation'
import { resolveSettingsSubpage, settingsSubpageIcon, settingsSubpages } from './subpages'
import type { SettingsPageProps, SettingsView as SettingsViewId } from './types'
import { vaultOwnerKey, VaultSettings } from './vault-settings'
import { XinyuanSettings } from './xinyuan-settings'

const SETTINGS_VIEWS: readonly SettingsViewId[] = [
  ...SECTIONS.map(s => `config:${s.id}` as SettingsViewId),
  'providers',
  'gateway',
  // Legacy alias: the Connections page merged into Gateways. Kept in the enum
  // so saved `?tab=connections` deep links still resolve (redirected below).
  'connections',
  'keybinds',
  // Legacy alias: the API Keys page is gone. Kept in the enum so a saved
  // `?tab=keys` deep link resolves and can be redirected below — dropping it
  // would make `useRouteEnumParam` coerce the tab to the default instead.
  'keys',
  'vault',
  'notifications',
  'billing',
  'sessions',
  'plugins',
  'about'
]

// Pages that take nothing but the resolved sub-page.
const SUBPAGE_VIEWS: Partial<Record<SettingsViewId, ComponentType<{ subpage?: string }>>> = {
  'config:appearance': AppearanceSettings,
  about: AboutSettings,
  // 'connections' renders the unified page too so the frame before the alias
  // redirect lands doesn't flash the fallback view.
  connections: GatewaySettings,
  gateway: GatewaySettings,
  keybinds: KeybindSettings,
  notifications: NotificationsSettings
}

export function SettingsView({ onClose, onConfigSaved, onMainModelChanged }: SettingsPageProps) {
  const scopeProfile = useStore($settingsScopeProfile)
  const activeConnectionId = useStore($activeConnectionId)
  const { t } = useI18n()
  const navigate = useNavigate()
  const { hash, pathname, search } = useLocation()

  // MCP moved out of Settings into Capabilities. Keep old `/settings?tab=mcp`
  // deep links working — `useRouteEnumParam` would silently coerce the unknown
  // tab to the default view otherwise. (`tab=plugins` is live: Settings ▸
  // Plugins hosts each plugin's own settings pages.)
  useEffect(() => {
    const redirect = movedSettingsTabRedirect(search)

    if (redirect) {
      navigate(redirect, { replace: true })
    }
  }, [navigate, search])

  const [activeView] = useRouteEnumParam('tab', SETTINGS_VIEWS, 'config:model' as SettingsViewId)

  useEffect(() => recordFeatureUse(settingsArea(activeView)), [activeView])
  const params = new URLSearchParams(search)
  const requestedSubpage = params.get('page')
  const subpage = resolveSettingsSubpage(activeView, params)
  const needsSubpageRedirect = Boolean(subpage && subpage !== requestedSubpage)
  const subpageSearch = new URLSearchParams(search)

  if (subpage) {
    subpageSearch.set('page', subpage)
  }

  const openSettingsPage = useCallback(
    (view: SettingsViewId, page?: string) => {
      const next = new URLSearchParams(search)

      for (const key of [...PAGE_SCOPED_PARAMS, 'pview', 'kview', 'bview']) {
        next.delete(key)
      }

      next.set('tab', view)
      const destination = page ?? settingsSubpages(view)[0]?.id

      if (destination) {
        next.set('page', destination)
      }

      navigate({ hash, pathname, search: `?${next}` }, { replace: true })
    },
    [hash, navigate, pathname, search]
  )

  const setActiveView = useCallback((view: SettingsViewId) => openSettingsPage(view), [openSettingsPage])

  // Connections merged into the unified Gateways page: land old
  // `?tab=connections` routes/bookmarks there instead of a dead entry.
  useEffect(() => {
    if (activeView === 'connections') {
      setActiveView('gateway')
    }
  }, [activeView, setActiveView])
  // Providers subnav (Accounts vs API keys) lived in its own param so each
  // sub-view was deep-linkable. This build has exactly one provider surface,
  // so the param is gone with it — but a saved `?tab=keys` deep link still has
  // to resolve (see SETTINGS_VIEWS) and then land on the single form.
  useEffect(() => {
    if (activeView === 'keys') {
      setActiveView('providers')
    }
  }, [activeView, setActiveView])
  const [billingView] = useRouteEnumParam<BillingSubView>('bview', BILLING_VIEWS, 'overview')
  const billingState = useBillingState()
  const subscriptionState = useSubscriptionState()
  const billingPresentation = deriveBillingView(billingState.data, subscriptionState.data)
  const canViewPlans = billingPresentation.status === 'normal' && Boolean(billingPresentation.plan?.action)

  // Jump to a section + its sub-view in one navigate. Two sequential setters
  // would each read the same stale `search` and the second would clobber the
  // first's `tab` — so the sub-view never opened on narrow screens.
  const openSubView = useCallback(
    (tab: SettingsViewId, param: string, value: string, fallback: string) => {
      const params = new URLSearchParams(search)

      for (const key of PAGE_SCOPED_PARAMS) {
        params.delete(key)
      }

      params.set('tab', tab)

      if (value === fallback) {
        params.delete(param)
      } else {
        params.set(param, value)
      }

      const qs = params.toString()
      navigate({ hash, pathname, search: qs ? `?${qs}` : '' }, { replace: true })
    },
    [hash, navigate, pathname, search]
  )

  const plugins = usePluginSettingsRoute(activeView === 'plugins')

  const importInputRef = useRef<HTMLInputElement | null>(null)

  const exportConfig = async () => {
    try {
      const cfg = await getHermesConfigRecord()
      const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'xinyuan-config.json'
      a.click()
      URL.revokeObjectURL(url)
      triggerHaptic('success')
    } catch (err) {
      notifyError(err, t.settings.exportFailed)
    }
  }

  const resetConfig = async () => {
    const ok = await confirm({
      confirmLabel: t.settings.resetToDefaults,
      destructive: true,
      title: t.settings.resetConfirm
    })

    if (!ok) {
      return
    }

    try {
      await saveHermesConfig(await getHermesConfigDefaults())
      triggerHaptic('success')
      onConfigSaved?.()
    } catch (err) {
      notifyError(err, t.settings.resetFailed)
    }
  }

  const navGroups: OverlayNavGroup[] = useMemo(
    () =>
      (
        [
          ...SECTIONS.flatMap(s => {
            const view = `config:${s.id}` as SettingsViewId

            const entry = {
              active: activeView === view,
              icon: s.icon,
              id: view,
              label: t.settings.sections[s.id] ?? s.label,
              onSelect: () => setActiveView(view)
            }

            // Credential Vault lives beside the Browser section: it feeds the
            // browser's model-blind vault fill, so the two are one mental unit.
            if (s.id === 'browser') {
              return [
                entry,
                {
                  active: activeView === 'vault',
                  icon: ShieldLock,
                  id: 'vault',
                  label: t.settings.nav.vault,
                  onSelect: () => setActiveView('vault')
                }
              ]
            }

            return [entry]
          }),
          {
            active: activeView === 'notifications',
            icon: Bell,
            id: 'notifications',
            label: t.settings.nav.notifications,
            onSelect: () => setActiveView('notifications')
          },
          {
            active: activeView === 'billing',
            children: [
              {
                active: activeView === 'billing' && (billingView === 'overview' || !canViewPlans),
                icon: BarChart3,
                id: 'bview:overview',
                label: t.settings.subpages.billingOverview,
                onSelect: () => openSubView('billing', 'bview', 'overview', 'overview')
              },
              ...(canViewPlans
                ? [
                    {
                      active: activeView === 'billing' && billingView === 'plans',
                      icon: BarChart3,
                      id: 'bview:plans',
                      label: t.settings.subpages.billingPlans,
                      onSelect: () => openSubView('billing', 'bview', 'plans', 'overview')
                    }
                  ]
                : [])
            ],
            icon: BarChart3,
            id: 'billing',
            label: t.settings.nav.billing,
            onSelect: () => setActiveView('billing')
          },
          {
            // The whole provider surface collapsed into one entry: this build
            // talks to a single pre-filled endpoint, so there is no catalog to
            // browse (accounts / API keys / custom endpoints / local models).
            // The endpoint itself is editable inside the form.
            active: activeView === 'providers',
            gapBefore: true,
            icon: Zap,
            id: 'providers',
            label: t.settings.nav.providers,
            onSelect: () => setActiveView('providers')
          },
          {
            active: activeView === 'gateway',
            icon: Globe,
            id: 'gateway',
            label: t.settings.nav.gateway,
            onSelect: () => setActiveView('gateway')
          },
          {
            active: activeView === 'keybinds',
            icon: Keyboard,
            id: 'keybinds',
            label: t.settings.nav.keybinds,
            onSelect: () => setActiveView('keybinds')
          },
          {
            active: activeView === 'sessions',
            icon: Archive,
            id: 'sessions',
            label: t.settings.nav.sessions,
            onSelect: () => setActiveView('sessions')
          },
          {
            active: activeView === 'plugins',
            children: pluginSettingsNavChildren(plugins.entries, plugins.target, plugins.open),
            gapBefore: true,
            icon: PLUGINS_NAV_ICON,
            id: 'plugins',
            label: t.settings.nav.plugins,
            onSelect: () => plugins.open(null)
          },
          {
            active: activeView === 'about',
            gapBefore: true,
            icon: Info,
            id: 'about',
            label: t.settings.nav.about,
            onSelect: () => setActiveView('about')
          }
        ] as OverlayNavGroup[]
      ).map(group => {
        const view = group.id as SettingsViewId
        const children = settingsSubpages(view)

        return children.length
          ? {
              ...group,
              children: children.map(page => ({
                active: group.active && subpage === page.id,
                icon: settingsSubpageIcon(page, group.icon),
                id: `${view}:${page.id}`,
                label: t.settings.subpages[page.labelKey],
                onSelect: () => openSettingsPage(view, page.id)
              }))
            }
          : group
      }),
    [
      activeView,
      billingView,
      canViewPlans,
      plugins,
      subpage,
      t,
      setActiveView,
      openSettingsPage,
      openSubView
    ]
  )

  const activeGroup = navGroups.find(group => group.active)
  const activeChild = activeGroup?.children?.find(child => child.active)

  // Type-to-search: printable keystrokes on the Settings surface (outside any
  // field) open the settings-scoped palette, seeded with the character — same
  // reflex as the chat surface's type-to-focus, pointed at search instead.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ($commandPaletteOpen.get() || isEditableTarget(event.target)) {
        return
      }

      const char = typeToFocusChar(event)

      if (char === null || char === ' ') {
        return
      }

      event.preventDefault()
      openCommandPalettePage('settings', char)
    }

    window.addEventListener('keydown', onKeyDown)

    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Fake search pill riding the card's top edge, dead-center and half off it.
  // Clicking (or just typing) opens the ⌘K palette scoped to settings; while
  // the palette is up the pill hands over to it — grows slightly and fades,
  // then fades back when the palette closes. It sits outside the raised card,
  // so it needs its own opaque glass surface to mask the content underneath.
  const searchCombo = bindingsFor('nav.commandPalette')[0]
  const paletteOpen = useStore($commandPaletteOpen)

  const searchPill = (
    <button
      className={cn(
        'flex h-(--titlebar-control-height) items-center gap-1.5 rounded-full border border-(--ui-stroke-secondary) bg-(--ui-chat-surface-background) px-2.5 text-(--ui-text-tertiary) shadow-sm transition-all duration-200 ease-out hover:text-foreground motion-reduce:transition-none',
        paletteOpen && 'pointer-events-none scale-110 opacity-0'
      )}
      data-glass-opaque=""
      onClick={() => {
        triggerHaptic('open')
        openCommandPalettePage('settings')
      }}
      tabIndex={paletteOpen ? -1 : undefined}
      type="button"
    >
      <Search className="size-3" />
      <span className="text-xs">{t.settings.search.pill}</span>
      {searchCombo && <KbdCombo combo={searchCombo} size="sm" variant="ghost" />}
    </button>
  )

  const navFooter = (
    <>
      <Tip label={t.settings.exportConfig}>
        <OverlayIconButton onClick={() => void exportConfig()}>
          <Download />
        </OverlayIconButton>
      </Tip>
      <Tip label={t.settings.importConfig}>
        <OverlayIconButton
          onClick={() => {
            triggerHaptic('open')
            importInputRef.current?.click()
          }}
        >
          <Upload />
        </OverlayIconButton>
      </Tip>
      <Tip label={t.settings.resetToDefaults}>
        <OverlayIconButton
          className="hover:text-destructive"
          onClick={() => {
            triggerHaptic('warning')
            void resetConfig()
          }}
        >
          <RefreshCw />
        </OverlayIconButton>
      </Tip>
    </>
  )

  const SubpageView = SUBPAGE_VIEWS[activeView]

  const activeSettingsContent = SubpageView ? (
    <SubpageView subpage={subpage} />
  ) : activeView.startsWith('config:') ? (
    <ConfigSettings
      activeSectionId={activeView.slice('config:'.length)}
      importInputRef={importInputRef}
      onConfigSaved={onConfigSaved}
      onMainModelChanged={onMainModelChanged}
      subpage={subpage}
    />
  ) : activeView === 'providers' ? (
    <XinyuanSettings key={scopeProfile} onConfigSaved={onConfigSaved} />
  ) : activeView === 'billing' ? (
    <BillingSettings />
  ) : activeView === 'plugins' ? (
    <PluginSettingsPane
      entries={plugins.entries}
      missing={plugins.missing}
      onOpen={plugins.open}
      pending={plugins.pending}
      target={plugins.target}
    />
  ) : activeView === 'vault' ? (
    <VaultSettings key={vaultOwnerKey(activeConnectionId, scopeProfile)} subpage={subpage} />
  ) : (
    <SessionsSettings subpage={subpage} />
  )

  return (
    <OverlayView closeLabel={t.settings.closeSettings} edgeBadge={searchPill} onClose={onClose}>
      <OverlaySplitLayout>
        <OverlayNav footer={navFooter} groups={navGroups} />

        <OverlayMain className="px-0 pb-0">
          <SettingsBreadcrumbContext.Provider value>
            {activeGroup && <SettingsSubpageHeader child={activeChild} group={activeGroup} />}
            {needsSubpageRedirect ? (
              <Navigate replace to={{ hash, pathname, search: `?${subpageSearch}` }} />
            ) : (
              activeSettingsContent
            )}
          </SettingsBreadcrumbContext.Provider>
        </OverlayMain>
      </OverlaySplitLayout>
    </OverlayView>
  )
}

export { SettingsView as SettingsPage }
