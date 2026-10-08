import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vksha-event';
    
    await mongoose.connect(mongoUri);

    const users = mongoose.connection.collection('users');
    const indexes = await users.indexes();
    const emailIndex = indexes.find(index => {
      const keys = Object.keys(index.key || {});
      return keys.length === 1 && keys[0] === 'email' && index.unique === true;
    });
    const hasNullableEmailSafeIndex = emailIndex?.partialFilterExpression?.email?.$type === 'string';
    if (emailIndex && !hasNullableEmailSafeIndex) {
      await users.dropIndex(emailIndex.name!);
      console.log('♻️ Replaced legacy unique email index');
    }
    if (!hasNullableEmailSafeIndex) {
      await users.createIndex(
        { email: 1 },
        { unique: true, partialFilterExpression: { email: { $type: 'string' } } }
      );
    }

    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected');
  } catch (error) {
    console.error('❌ MongoDB disconnection error:', error);
  }
};
