const mongoose = require('mongoose');
require('dotenv').config();

async function checkDatabase() {
  try {
    console.log('🔍 Checking MongoDB Database...\n');

    // Connect to MongoDB
    console.log('1. Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test');
    console.log('✅ Connected to MongoDB successfully');

    // Get database info
    const db = mongoose.connection.db;
    console.log('📊 Database Name:', db.databaseName);

    // List all collections
    console.log('\n2. Checking existing collections...');
    const collections = await db.listCollections().toArray();
    console.log('📋 Existing Collections:');
    collections.forEach(collection => {
      console.log(`   - ${collection.name}`);
    });

    // Check if orders collection exists
    const ordersCollectionExists = collections.some(col => col.name === 'orders');
    console.log(`\n3. Orders Collection Status: ${ordersCollectionExists ? '✅ EXISTS' : '❌ MISSING'}`);

    if (!ordersCollectionExists) {
      console.log('\n4. Creating orders collection...');
      
      // Import the Order model to create the collection
      const Order = require('./backend/models/Order');
      
      // Create a dummy order to initialize the collection
      const dummyOrder = new Order({
        orderNumber: 'DUMMY-001',
        buyer: new mongoose.Types.ObjectId(),
        items: [{
          product: new mongoose.Types.ObjectId(),
          name: 'Dummy Product',
          price: 0,
          unit: 'kg',
          quantity: 1,
          total: 0,
          farmer: new mongoose.Types.ObjectId(),
          farmerName: 'Dummy Farmer'
        }],
        deliveryAddress: {
          fullName: 'Dummy User',
          phone: '0000000000',
          address: 'Dummy Address',
          city: 'Dummy City',
          state: 'Dummy State',
          pincode: '000000'
        },
        subtotal: 0,
        total: 0
      });

      await dummyOrder.save();
      console.log('✅ Orders collection created successfully');
      
      // Delete the dummy order
      await Order.findByIdAndDelete(dummyOrder._id);
      console.log('✅ Dummy order removed');
    }

    // Check collection stats
    console.log('\n5. Collection Statistics:');
    for (const collection of collections) {
      try {
        const stats = await db.collection(collection.name).stats();
        console.log(`   - ${collection.name}: ${stats.count} documents`);
      } catch (error) {
        console.log(`   - ${collection.name}: Error getting stats`);
      }
    }

    // Test order creation
    console.log('\n6. Testing order creation...');
    const Order = require('./backend/models/Order');
    
    const testOrder = new Order({
      orderNumber: 'TEST-001',
      buyer: new mongoose.Types.ObjectId(),
      items: [{
        product: new mongoose.Types.ObjectId(),
        name: 'Test Product',
        price: 100,
        unit: 'kg',
        quantity: 1,
        total: 100,
        farmer: new mongoose.Types.ObjectId(),
        farmerName: 'Test Farmer'
      }],
      deliveryAddress: {
        fullName: 'Test User',
        phone: '1234567890',
        address: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456'
      },
      subtotal: 100,
      total: 100,
      region: "Test Region"
    });

    await testOrder.save();
    console.log('✅ Test order created successfully');
    console.log('   - Order ID:', testOrder._id);
    console.log('   - Order Number:', testOrder.orderNumber);

    // Clean up test order
    await Order.findByIdAndDelete(testOrder._id);
    console.log('✅ Test order cleaned up');

    console.log('\n🎉 Database check completed successfully!');
    console.log('✅ Orders collection is ready for use');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 'ENOTFOUND') {
      console.error('   - MongoDB connection failed. Check your MONGO_URI in .env file');
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkDatabase(); 