export const accountPermissionsList = {
    sections: [      
      {
        title: 'Full Store Management',
        permissions: [
          {
            label: `All actions in the context of this store. Selecting this permission means the any user with this role has no limits in this store and you don't need to select any other permissions below`,
            value: 'store.*',
            selected: false
          }
        ]
      },
      {
        title: 'Audit logs',
        permissions: [
          {
            label: 'All audit logs actions',
            value: 'store.audit-logs.*',
            selected: false
          },
          {
            label: 'See all audit logs',
            value: 'store.audit-logs.read',
            selected: false
          },
        ]
      },       
      {
        title: 'Price cards',
        permissions: [
          {
            label: 'All price cards actions',
            value: 'store.price-cards.*',
            selected: false
          },
          {
            label: 'Create price cards',
            value: 'store.price-cards.create',
            selected: false
          },
          {
            label: 'See all price cards',
            value: 'store.price-cards.read',
            selected: false
          },
          {
            label: 'Update price cards',
            value: 'store.price-cards.update',
            selected: false
          },
          {
            label: 'Delete price cards',
            value: 'store.price-cards.delete',
            selected: false
          },
        ]
      },
      {
        title: 'Inventory',
        permissions: [
          {
            label: 'All inventory actions',
            value: 'store.inventory.*',
            selected: false
          },
          {
            label: 'Create inventory items',
            value: 'store.inventory.create',
            selected: false
          },
          {
            label: 'List all inventory items',
            value: 'store.inventory.read',
            selected: false
          },
          {
            label: 'Update inventory',
            value: 'store.inventory.update',
            selected: false
          },
          {
            label: 'Approve inventory updates',
            value: 'store.inventory.approvals',
            selected: false
          },
          {
            label: 'Delete inventory',
            value: 'store.inventory.delete',
            selected: false
          },
        ]
      },
      {
        title: 'Payments',
        permissions: [
          {
            label: 'All payments actions',
            value: 'store.payments.*',
            selected: false
          },
          {
            label: 'Create payments',
            value: 'store.payments.create',
            selected: false
          },
          {
            label: 'Read all payments',
            value: 'store.payments.read',
            selected: false
          },
          {
            label: 'Update payments',
            value: 'store.payments.update',
            selected: false
          },
          {
            label: 'Delete payments',
            value: 'store.payments.delete',
            selected: false
          },
        ]
      },
      {
        title: 'Roles',
        permissions: [
          {
            label: 'All roles actions',
            value: 'store.roles.*',
            selected: false
          },
          {
            label: 'Create roles',
            value: 'store.roles.create',
            selected: false
          },
          {
            label: 'Read all roles',
            value: 'store.roles.read',
            selected: false
          },
          {
            label: 'Update roles',
            value: 'store.roles.update',
            selected: false
          },
          {
            label: 'Delete roles',
            value: 'store.roles.delete',
            selected: false
          },
        ]
      },
      {
        title: 'Users',
        permissions: [
          {
            label: 'All user actions',
            value: 'store.users.*',
            selected: false
          },
          {
            label: 'Create user',
            value: 'store.users.create',
            selected: false
          },
          {
            label: 'Read all user',
            value: 'staff.read',
            selected: false
          },
          {
            label: 'Update users',
            value: 'store.users.update',
            selected: false
          },
          {
            label: 'Delete users',
            value: 'store.users.delete',
            selected: false
          },
        ]
      }

    ]
  }