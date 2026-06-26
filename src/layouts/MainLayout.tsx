import { Layout, Menu } from 'antd'
import { ExperimentOutlined, BarChartOutlined } from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'

const { Sider, Content } = Layout

const menuItems = [
  {
    key: '/bigscreen',
    icon: <ExperimentOutlined />,
    label: '3D 大屏',
  },
  {
    key: '/dashboard',
    icon: <BarChartOutlined />,
    label: '工业看板',
  },
]

export function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <Layout style={{ height: '100vh' }}>
      <Content style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <Outlet />
        </div>
      </Content>
      <Sider
        width={200}
        style={{
          background: '#001529',
          overflow: 'auto',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 18,
            fontWeight: 'bold',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          🎯 大屏系统
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
    </Layout>
  )
}
