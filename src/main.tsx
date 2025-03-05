import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import App from './App.tsx'
import GlobalStyles from "./styles/GlobalStyles.tsx";
import {Provider} from "@/components/ui/provider.tsx";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider>
      <GlobalStyles/>
      <App/>
    </Provider>
  </StrictMode>,
)
