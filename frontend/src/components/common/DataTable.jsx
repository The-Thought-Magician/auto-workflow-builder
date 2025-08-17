import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  Skeleton,
  Stack
} from '@mui/material';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';

const DataTable = ({
  columns = [],
  rows = [],
  loading = false,
  onRowClick,
  actions = [],
  emptyMessage = "No data available",
  size = "medium",
  stickyHeader = false,
  maxHeight,
  ...props
}) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [selectedRow, setSelectedRow] = React.useState(null);

  const handleActionClick = (event, row) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedRow(row);
  };

  const handleActionClose = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };

  const handleActionItemClick = (action) => {
    if (action.onClick && selectedRow) {
      action.onClick(selectedRow);
    }
    handleActionClose();
  };

  const renderCell = (row, column) => {
    if (column.render) {
      return column.render(row[column.key], row);
    }
    return row[column.key];
  };

  if (loading) {
    return (
      <TableContainer component={Paper} sx={{ maxHeight }}>
        <Table stickyHeader={stickyHeader} size={size}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.key} align={column.align || 'left'}>
                  {column.label}
                </TableCell>
              ))}
              {actions.length > 0 && (
                <TableCell align="right" sx={{ width: 80 }}>
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell key={column.key}>
                    <Skeleton animation="wave" />
                  </TableCell>
                ))}
                {actions.length > 0 && (
                  <TableCell>
                    <Skeleton animation="wave" width={24} height={24} />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  if (!rows.length) {
    return (
      <Paper 
        sx={{ 
          p: 4, 
          textAlign: 'center',
          background: 'rgba(30, 41, 59, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <Typography variant="body1" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Paper>
    );
  }

  return (
    <>
      <TableContainer 
        component={Paper} 
        sx={{ 
          maxHeight,
          background: 'rgba(30, 41, 59, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(12px)'
        }}
        {...props}
      >
        <Table stickyHeader={stickyHeader} size={size}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell 
                  key={column.key} 
                  align={column.align || 'left'}
                  sx={{ 
                    fontWeight: 600,
                    backgroundColor: 'rgba(51, 65, 85, 0.8)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
              {actions.length > 0 && (
                <TableCell 
                  align="right" 
                  sx={{ 
                    width: 80,
                    fontWeight: 600,
                    backgroundColor: 'rgba(51, 65, 85, 0.8)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <motion.tr
                key={row.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.05,
                  ease: [0.68, -0.55, 0.265, 1.55]
                }}
                component={TableRow}
                hover={!!onRowClick}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                sx={{
                  cursor: onRowClick ? 'pointer' : 'default',
                  '&:hover': {
                    backgroundColor: 'rgba(59, 130, 246, 0.05)',
                  },
                  '& td': {
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  }
                }}
              >
                {columns.map((column) => (
                  <TableCell 
                    key={column.key} 
                    align={column.align || 'left'}
                    sx={{ color: 'text.primary' }}
                  >
                    {renderCell(row, column)}
                  </TableCell>
                ))}
                {actions.length > 0 && (
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(e) => handleActionClick(e, row)}
                      sx={{
                        color: 'text.secondary',
                        '&:hover': {
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          color: 'primary.main'
                        }
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                )}
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleActionClose}
        PaperProps={{
          sx: {
            backgroundColor: '#1e293b',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(12px)'
          }
        }}
      >
        {actions.map((action, index) => (
          <MenuItem
            key={index}
            onClick={() => handleActionItemClick(action)}
            disabled={action.disabled && action.disabled(selectedRow)}
            sx={{
              gap: 1,
              '&:hover': {
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
              }
            }}
          >
            {action.icon && action.icon}
            {action.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default DataTable;