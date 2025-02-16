import { Link } from 'react-router-dom';
import { Menu } from '@headlessui/react';

const UserMenu = ({ user }) => {
  return (
    <Menu.Item>
      {({ active }) => (
        <Link
          to="/admin"
          className={`${
            active ? 'bg-gray-100' : ''
          } block px-4 py-2 text-sm text-gray-700`}
        >
          Admin Panel
        </Link>
      )}
    </Menu.Item>
  );
};

export default UserMenu; 