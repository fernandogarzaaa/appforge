import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import PrivateRoute from '@/components/PrivateRoute'
import { BackendAuthContext } from '@/contexts/BackendAuthContext'

const MockComponent = () => <div>Protected Content</div>
const LoginComponent = () => <div>Login Page</div>

const renderWithRouter = (component, isAuthenticated = false) => {
  const mockAuthContext = {
    isAuthenticated,
    user: isAuthenticated ? { id: '1', email: 'test@test.com' } : null,
    login: vi.fn(),
    logout: vi.fn(),
    loading: false,
  }

  return render(
    <BackendAuthContext.Provider value={mockAuthContext}>
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<LoginComponent />} />
          <Route path="/protected" element={component} />
        </Routes>
      </MemoryRouter>
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
    
    renderWithRouter(privateRoute, true)
    
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('should redirect to login when not authenticated', () => {
    const privateRoute = (
      <PrivateRoute>
        <MockComponent />
      </PrivateRoute>
    )
    
    renderWithRouter(privateRoute, false)
    
    expect(screen.getByText('Login Page')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('should show loading state while checking authentication', () => {
    const mockAuthContext = {
      isAuthenticated: false,
      loading: true,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
    }

    const privateRoute = (
      <PrivateRoute>
        <MockComponent />
      </PrivateRoute>
    )

    render(
      <BackendAuthContext.Provider value={mockAuthContext}>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/login" element={<LoginComponent />} />
            <Route path="/protected" element={privateRoute} />
          </Routes>
        </MemoryRouter>
      </BackendAuthContext.Provider>
    )

    // Should not show login or protected content while loading
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument()
  })
})
