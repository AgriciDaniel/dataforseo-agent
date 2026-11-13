import { For } from "solid-js"
import { useTheme } from "../../context/theme"

export const HOME_STARTERS = [
  {
    title: "Keyword ideas",
    description: "Explore demand",
    prompt:
      'Find keyword ideas and search volumes for "your topic" in the US. Estimate the cost before making paid calls.',
  },
  {
    title: "SERP top 10",
    description: "Check rankings",
    prompt:
      'Show the top 10 Google organic results for "your keyword" in the US. Estimate the cost before making paid calls.',
  },
  {
    title: "Backlink gap",
    description: "Compare links",
    prompt:
      "Compare backlinks for example.com and competitor.com. Find domains linking to the competitor but not my site. Estimate the cost first.",
  },
  {
    title: "Site audit",
    description: "Find issues",
    prompt:
      "Plan a technical SEO audit of https://example.com. Explain the crawl scope and estimated cost before starting.",
  },
]

export function showHomeStarters(width: number, height: number, promptHeight = 0) {
  return width >= 72 && height >= Math.max(34, promptHeight + 22)
}

export function HomeStarters(props: { onSelect: (text: string) => void; disabled: boolean }) {
  const theme = useTheme()
  return (
    <box width="100%" maxWidth={75} flexDirection="row" flexShrink={0} gap={1} paddingTop={1}>
      <For each={HOME_STARTERS}>
        {(starter, index) => (
          <box
            id={`home-starter-${index()}`}
            flexGrow={1}
            flexBasis={0}
            minWidth={0}
            paddingLeft={1}
            paddingRight={1}
            backgroundColor={theme.background.action.secondary.base}
            onMouseUp={() => {
              if (!props.disabled) props.onSelect(starter.prompt)
            }}
          >
            <text
              fg={props.disabled ? theme.text.action.secondary.disabled : theme.text.action.secondary.base}
              wrapMode="none"
              truncate
              selectable={false}
            >
              {starter.title}
            </text>
            <text fg={theme.text.muted} wrapMode="none" truncate selectable={false}>
              {starter.description}
            </text>
          </box>
        )}
      </For>
    </box>
  )
}
