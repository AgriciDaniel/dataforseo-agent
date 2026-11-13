import { createMemo, Show } from "solid-js"
import { useData } from "../../context/data"
import { useTheme } from "../../context/theme"
import { budgetUsage, useAccount, usd } from "./account"

export function AccountReadout(props: { sessionID: string }) {
  const theme = useTheme()
  const account = useAccount(useData(), () => props.sessionID)
  const status = createMemo(() => budgetUsage(account.spent(), account.budget()).status)

  return (
    <Show when={account.account()}>
      {(value) => (
        <text id="prompt-account" fg={theme.text.muted} flexShrink={0} wrapMode="word">
          {usd(value().balance)} ·{" "}
          <span style={{ fg: status() === "success" ? theme.text.muted : theme.text.feedback[status()].base }}>
            session {usd(account.spent())} of {usd(account.budget())}
          </span>
        </text>
      )}
    </Show>
  )
}
