import "chrry/styles.scss"
// import "chrry/styles/view-transitions.css"
import "./App.css"
import Chrry from "chrry/Chrry"
import { HistoryRouterProvider } from "../../../packages/ui/context/providers/HistoryRouterProvider"
import { updateExtensionIcon } from "./utils/updateIcon"

function App() {
  return (
    <HistoryRouterProvider>
      <Chrry useExtensionIcon={updateExtensionIcon} />
    </HistoryRouterProvider>
  )
}

export default App
