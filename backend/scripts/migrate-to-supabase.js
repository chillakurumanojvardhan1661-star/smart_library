import { createClient } from '@supabase/supabase-js';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials not found in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateData() {
  console.log('🚀 Starting migration from SQLite to Supabase...\n');

  try {
    // Open SQLite database
    const db = await open({
      filename: './library.db',
      driver: sqlite3.Database
    });

    // 1. Create schema in Supabase
    console.log('📋 Step 1: Creating schema in Supabase...');
    const schema = fs.readFileSync('../database/schema.sql', 'utf8');
    
    // Note: You'll need to run this SQL manually in Supabase SQL Editor
    // or use Supabase CLI
    console.log('⚠️  Please run the schema.sql file in Supabase SQL Editor first');
    console.log('   Then press Enter to continue...');
    
    // Wait for user confirmation
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });

    // 2. Migrate roles
    console.log('\n📊 Step 2: Migrating roles...');
    const roles = await db.all('SELECT * FROM roles');
    if (roles.length > 0) {
      const { error } = await supabase.from('roles').insert(roles);
      if (error) console.error('Error migrating roles:', error);
      else console.log(`✅ Migrated ${roles.length} roles`);
    }

    // 3. Migrate users
    console.log('\n👥 Step 3: Migrating users...');
    const users = await db.all('SELECT * FROM users');
    if (users.length > 0) {
      const { error } = await supabase.from('users').insert(users);
      if (error) console.error('Error migrating users:', error);
      else console.log(`✅ Migrated ${users.length} users`);
    }

    // 4. Migrate books
    console.log('\n📚 Step 4: Migrating books...');
    const books = await db.all('SELECT * FROM books');
    if (books.length > 0) {
      const { error } = await supabase.from('books').insert(books);
      if (error) console.error('Error migrating books:', error);
      else console.log(`✅ Migrated ${books.length} books`);
    }

    // 5. Migrate members
    console.log('\n🎫 Step 5: Migrating members...');
    const members = await db.all('SELECT * FROM members');
    if (members.length > 0) {
      const { error } = await supabase.from('members').insert(members);
      if (error) console.error('Error migrating members:', error);
      else console.log(`✅ Migrated ${members.length} members`);
    }

    // 6. Migrate issues
    console.log('\n📖 Step 6: Migrating issues...');
    const issues = await db.all('SELECT * FROM issues');
    if (issues.length > 0) {
      const { error } = await supabase.from('issues').insert(issues);
      if (error) console.error('Error migrating issues:', error);
      else console.log(`✅ Migrated ${issues.length} issues`);
    }

    // 7. Migrate reservations
    console.log('\n🔖 Step 7: Migrating reservations...');
    const reservations = await db.all('SELECT * FROM reservations');
    if (reservations.length > 0) {
      const { error } = await supabase.from('reservations').insert(reservations);
      if (error) console.error('Error migrating reservations:', error);
      else console.log(`✅ Migrated ${reservations.length} reservations`);
    }

    // 8. Migrate fines
    console.log('\n💰 Step 8: Migrating fines...');
    const fines = await db.all('SELECT * FROM fines');
    if (fines.length > 0) {
      const { error } = await supabase.from('fines').insert(fines);
      if (error) console.error('Error migrating fines:', error);
      else console.log(`✅ Migrated ${fines.length} fines`);
    }

    await db.close();

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Update backend/.env: USE_SUPABASE=true');
    console.log('2. Restart backend server');
    console.log('3. Test the application');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateData();
