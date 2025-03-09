import {createBrowserRouter, createRoutesFromElements, Route, RouterProvider} from "react-router-dom";
import RootLayout from "./layouts/RootLayout.tsx";
import HomePage from "./pages/HomePage.tsx";
import NotFoundPage from "./pages/NotFoundPage.tsx";
import TestPage from "./pages/TestPage.tsx";

const router = createBrowserRouter(createRoutesFromElements(
  <Route element={<RootLayout/>}>
    <Route index element={<HomePage/>}/>
    <Route path="/test" element={<TestPage/>}/>
    <Route path="*" element={<NotFoundPage/>}/>
  </Route>
))

function App() {
  return (
    <RouterProvider router={router}/>
  )
}

export default App
