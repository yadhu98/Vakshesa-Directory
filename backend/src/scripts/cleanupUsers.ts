/**
 * Cleanup Script: Delete all users except Super Admin
 * 
 * This script:
 * 1. Keeps only the Super Admin user (admin@vakshesa.com)
 * 2. Deletes all other users from the database
 * 3. Excludes Super Admin from family tree (they have no family relations)
 * 
 * Run with: npx ts-node src/scripts/cleanupUsers.ts
 */

import * as dotenv from 'dotenv';
import Database from '../config/database';

dotenv.config();

const superAdminEmail = 'admin@vakshesa.com';

async function cleanupUsers() {
  const db = new Database();

  try {
    console.log('🔄 Connecting to database...');
    await db.connect();
    console.log('✅ Connected to database\n');

    // Get total count of users before cleanup
    const allUsers = await db.find('users', {});
    console.log(`📊 Total users before cleanup: ${allUsers.length}`);

    // Find Super Admin
    const superAdmin = await db.findOne('users', { email: superAdminEmail });
    
    if (!superAdmin) {
      console.error('❌ Super Admin not found! Cannot proceed with cleanup.');
      process.exit(1);
    }

    console.log(`👑 Found Super Admin: ${superAdmin.firstName} ${superAdmin.lastName} (${superAdmin.email})\n`);

    // Delete all users except Super Admin
    const result = await db.deleteMany('users', { email: { $ne: superAdminEmail } });
    console.log(`🗑️  Deleted ${result.deletedCount} users`);

    // Get remaining users
    const remainingUsers = await db.find('users', {});
    console.log(`📊 Total users after cleanup: ${remainingUsers.length}`);

    // Display remaining users
    if (remainingUsers.length > 0) {
      console.log('\n👥 Remaining users:');
      remainingUsers.forEach((user) => {
        console.log(`  • ${user.firstName} ${user.lastName} (${user.email})`);
      });
    }

    console.log('\n✅ Cleanup completed successfully!');
    console.log('📝 Notes:');
    console.log('  - Super Admin is kept (admin@vakshesa.com)');
    console.log('  - All other users have been deleted');
    console.log('  - Family tree will be empty until new users are added');
    console.log('  - Super Admin is excluded from family tree (no family relations)\n');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await db.disconnect();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

cleanupUsers();
