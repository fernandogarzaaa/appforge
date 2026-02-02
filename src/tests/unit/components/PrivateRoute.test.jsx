import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import PrivateRoute from '@/components/PrivateRoute'
import { BackendAuthContext } from '@/contexts/BackendAuthContext'

const MockComponent = () => <div>Protected Content</div>
const LoginComponent = () => <div>Login Page</div>

const renderWithRouter = (component, authOverrides = {}) => {
  const mockAuthContext = {
    isAuthenticated: false,
    user: null,
    login: vi.fn(),
    logout: vi.fn(),
    loading: false,
    ...authOverrides,
  }

  const router = createMemoryRouter(
    [
      { path: '/login', element: <LoginComponent /> },
      { path: '/protected', element: component },
    ],
    {
      initialEntries: ['/protected'],
      future: {
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      },
    }
  )

  return render(
    <BackendAuthContext.Provider value={mockAuthContext}>
      <RouterProvider router={router} />
    </BackendAuthContext.Provider>
  )
}

describe('PrivateRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render protected content when authenticated', () => {
    const privateRoute = (
      <PrivateRoute>
        <MockComponent />
      </PrivateRoute>
    )
    
    renderWithRouter(privateRoute, {
      isAuthenticated: true,
      user: { id: '1', email: 'test@test.com' },
    })
    
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('should redirect to login when not authenticated', () => {
    const privateRoute = (
      <PrivateRoute>
        <MockComponent />
      </PrivateRoute>
    )
    
    renderWithRouter(privateRoute)
    
    expect(screen.getByText('Login Page')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('should show loading state while checking authentication', () => {
    const privateRoute = (
      <PrivateRoute>
        <MockComponent />
      </PrivateRoute>
    )

    renderWithRouter(privateRoute, {
      isAuthenticated: false,
      loading: true,
    })

    // Should not show login or protected content while loading
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument()
  })
})
