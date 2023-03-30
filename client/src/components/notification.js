import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { IconButton, Badge, Popover, Typography } from '@material-ui/core';
import { Notifications as NotificationsIcon } from '@material-ui/icons';
import io from 'socket.io-client';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    '& > *': {
      margin: theme.spacing(0, 2),
    },
  },
  popover: {
    padding: theme.spacing(2),
  },
}));

const NotificationBar = () => {
  const classes = useStyles();
  const [notifications, setNotifications] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const socket = io('http://localhost:7070/notifications');

    socket.on('notification', (data) => {
      setNotifications((prevNotifications) => [
        ...prevNotifications,
        { message: data.message, timestamp: new Date() },
      ]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleBellClick = (event) => {
    setAnchorEl(event.currentTarget);
    setShowNotifications(true);
  };

  const handlePopoverClose = () => {
    setShowNotifications(false);
  };

  const open = Boolean(anchorEl);

  return (
    <div className={classes.root}>
      <IconButton onClick={handleBellClick}>
        <Badge badgeContent={notifications.length} color="secondary">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Popover
        open={showNotifications && open}
        anchorEl={anchorEl}
        onClose={handlePopoverClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <div className={classes.popover}>
          {notifications.map((notification, index) => (
            <div key={index}>
              {notification.message} - {notification.timestamp.toLocaleString()}
            </div>
          ))}
          {notifications.length === 0 && (
            <Typography>No notifications to display</Typography>
          )}
        </div>
      </Popover>
    </div>
  );
};

export default NotificationBar;
