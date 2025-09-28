import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Breadcrumbs,
  Link,
  Avatar,
} from '@mui/material';
import {
  School as SchoolIcon,
  Home as HomeIcon,
  Add as AddIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch } from '../store/hooks';
import { logout } from '../store/slices/authSlice';

interface HeaderProps {
  userEmail?: string;
}

const Header: React.FC<HeaderProps> = ({ userEmail }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  const getBreadcrumbs = () => {
    const path = location.pathname;
    const breadcrumbs = [
      {
        label: 'ホーム',
        icon: <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />,
        path: '/',
        current: path === '/',
      },
    ];

    if (path.startsWith('/add')) {
      breadcrumbs.push({
        label: '新規登録',
        icon: <AddIcon sx={{ mr: 0.5 }} fontSize="inherit" />,
        path: '/add',
        current: true,
      });
    } else if (path.startsWith('/edit/')) {
      breadcrumbs.push({
        label: '編集',
        icon: <SchoolIcon sx={{ mr: 0.5 }} fontSize="inherit" />,
        path: path,
        current: true,
      });
    } else if (path.startsWith('/study/')) {
      breadcrumbs.push({
        label: '学習',
        icon: <SchoolIcon sx={{ mr: 0.5 }} fontSize="inherit" />,
        path: path,
        current: true,
      });
    } else if (path.startsWith('/detail/')) {
      breadcrumbs.push({
        label: '詳細',
        icon: <SchoolIcon sx={{ mr: 0.5 }} fontSize="inherit" />,
        path: path,
        current: true,
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <AppBar 
      position="sticky" 
      elevation={2}
      sx={{ 
        background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
        width: '100%',
        margin: 0,
        left: 0,
        right: 0,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SchoolIcon sx={{ fontSize: 32 }} />
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 'bold',
              display: { xs: 'none', sm: 'block' },
            }}
          >
            学習管理アプリ
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {userEmail && (
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.2)' }}>
                {userEmail.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                {userEmail}
              </Typography>
            </Box>
          )}
          <Button
            color="inherit"
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            sx={{
              borderRadius: 2,
              px: 2,
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)',
              },
            }}
          >
            ログアウト
          </Button>
        </Box>
      </Toolbar>

      {(breadcrumbs.length > 1 || location.pathname === '/') && (
        <Box
          sx={{
            px: 2,
            py: 1,
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Breadcrumbs
            separator="›"
            sx={{
              '& .MuiBreadcrumbs-separator': {
                color: 'rgba(255,255,255,0.7)',
              },
            }}
          >
            {breadcrumbs.map((crumb, index) => {
              if (crumb.current) {
                return (
                  <Typography
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      color: 'white',
                      fontWeight: 'medium',
                    }}
                  >
                    {crumb.icon}
                    {crumb.label}
                  </Typography>
                );
              } else {
                return (
                  <Link
                    key={index}
                    component="button"
                    variant="body2"
                    onClick={() => navigate(crumb.path)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      color: 'rgba(255,255,255,0.8)',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      border: 'none',
                      background: 'none',
                      '&:hover': {
                        color: 'white',
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    {crumb.icon}
                    {crumb.label}
                  </Link>
                );
              }
            })}
          </Breadcrumbs>
        </Box>
      )}
    </AppBar>
  );
};

export default Header;