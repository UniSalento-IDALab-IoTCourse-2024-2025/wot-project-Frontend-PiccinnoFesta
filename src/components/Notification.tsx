import React from 'react';

interface Notification {
  id: string | number;
  message: string;
}

interface NotificationsProps {
  notifications: Notification[];
}

const Notifications: React.FC<NotificationsProps> = ({ notifications }) => {
  return (
    <div>
      {notifications.map((n) => (
        <div key={n.id} style={styles.listItem}>
          {n.message}
        </div>
      ))}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  listItem: {
    backgroundColor: '#fff6f6',
    borderLeft: '4px solid #e74c3c',
    padding: '10px',
    marginBottom: '8px',
    borderRadius: '4px',
    fontSize: '14px',
  },
};

export default Notifications;