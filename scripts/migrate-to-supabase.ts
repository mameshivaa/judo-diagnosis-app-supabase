import { createClient } from '@supabase/supabase-js';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import * as dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Firebase Admin
const firebaseApp = initializeApp({
  credential: cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
});

const firestore = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

async function migrateUsers() {
  console.log('Migrating users...');
  const usersSnapshot = await firestore.collection('users').get();
  
  for (const doc of usersSnapshot.docs) {
    const userData = doc.data();
    
    try {
      // Create user in Supabase
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        email_confirm: true,
        user_metadata: {
          full_name: userData.displayName,
          avatar_url: userData.photoURL,
        },
      });

      if (authError) {
        console.error(`Failed to create user ${userData.email}:`, authError);
        continue;
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authUser.user.id,
          username: userData.username || userData.email?.split('@')[0],
          full_name: userData.displayName,
          avatar_url: userData.photoURL,
        });

      if (profileError) {
        console.error(`Failed to create profile for ${userData.email}:`, profileError);
      }

      console.log(`Migrated user: ${userData.email}`);
    } catch (error) {
      console.error(`Error migrating user ${userData.email}:`, error);
    }
  }
}

async function migrateFiles() {
  console.log('Migrating files...');
  const [files] = await storage.bucket().getFiles();

  for (const file of files) {
    try {
      const [buffer] = await file.download();
      const fileName = file.name;
      const contentType = file.metadata.contentType;

      const { error: uploadError } = await supabase.storage
        .from('user-content')
        .upload(fileName, buffer, {
          contentType,
          upsert: true,
        });

      if (uploadError) {
        console.error(`Failed to upload file ${fileName}:`, uploadError);
        continue;
      }

      console.log(`Migrated file: ${fileName}`);
    } catch (error) {
      console.error(`Error migrating file ${file.name}:`, error);
    }
  }
}

async function migrateCollections() {
  console.log('Migrating collections...');
  const collections = ['your_collection_names_here']; // Add your collection names

  for (const collectionName of collections) {
    console.log(`Migrating collection: ${collectionName}`);
    const snapshot = await firestore.collection(collectionName).get();

    for (const doc of snapshot.docs) {
      try {
        const data = doc.data();
        const { error } = await supabase
          .from(collectionName)
          .insert({
            id: doc.id,
            ...data,
            created_at: data.createdAt?.toDate().toISOString(),
            updated_at: data.updatedAt?.toDate().toISOString(),
          });

        if (error) {
          console.error(`Failed to migrate document ${doc.id}:`, error);
          continue;
        }

        console.log(`Migrated document: ${collectionName}/${doc.id}`);
      } catch (error) {
        console.error(`Error migrating document ${doc.id}:`, error);
      }
    }
  }
}

async function main() {
  try {
    await migrateUsers();
    await migrateFiles();
    await migrateCollections();
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();