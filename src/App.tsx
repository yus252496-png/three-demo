import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, theme } from 'antd'
import { MainLayout } from './layouts/MainLayout'
import { BigScreen } from './pages/BigScreen'

export default function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: { colorPrimary: '#1677ff' },
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/bigscreen" replace />} />
            <Route path="/bigscreen" element={<BigScreen />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  )
}
