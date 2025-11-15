import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
} from '@mui/material';
import { MoreVert, Search } from '@mui/icons-material';
import {
  useGetUsersQuery,
  useUpdateUserRoleMutation,
  useDeleteUserMutation,
} from '../features/api/apiSlice';
import { toast } from 'react-toastify';

const AdminPanel = () => {
  const [tabValue, setTabValue] = useState(0);
  const [search, setSearch] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const { data: usersData, isLoading } = useGetUsersQuery({ search });
  const [updateUserRole] = useUpdateUserRoleMutation();
  const [deleteUser] = useDeleteUserMutation();

  const handleMenuOpen = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleChangeRole = async (newRole) => {
    if (!selectedUser) return;

    try {
      await updateUserRole({ id: selectedUser._id, role: newRole }).unwrap();
      toast.success('User role updated successfully');
      handleMenuClose();
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to update user role');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    if (window.confirm(`Are you sure you want to deactivate user ${selectedUser.name}?`)) {
      try {
        await deleteUser(selectedUser._id).unwrap();
        toast.success('User deactivated successfully');
        handleMenuClose();
      } catch (error) {
        toast.error(error?.data?.message || 'Failed to deactivate user');
      }
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" fontWeight={600} sx={{ mb: 3 }}>
        Admin Panel
      </Typography>

      <Paper>
        <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
          <Tab label="Users" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          <TextField
            fullWidth
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />

          {isLoading ? (
            <Typography>Loading...</Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Joined</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {usersData?.data?.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.role}
                          size="small"
                          color={
                            user.role === 'admin'
                              ? 'error'
                              : user.role === 'manager'
                              ? 'primary'
                              : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.isActive ? 'Active' : 'Inactive'}
                          size="small"
                          color={user.isActive ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, user)}
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Paper>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleChangeRole('admin')}>
          Change Role to Admin
        </MenuItem>
        <MenuItem onClick={() => handleChangeRole('manager')}>
          Change Role to Manager
        </MenuItem>
        <MenuItem onClick={() => handleChangeRole('user')}>
          Change Role to User
        </MenuItem>
        <MenuItem onClick={handleDeleteUser} sx={{ color: 'error.main' }}>
          Deactivate User
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default AdminPanel;

