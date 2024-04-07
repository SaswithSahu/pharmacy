const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require("cors");

const User = require('./models/userSchema');
const Order = require("./models/orderSchema");
const Product = require("./models/productSchema");
const RawMaterial = require("./models/rawMaterialSchema");
const ManufacturerOrder = require("./models/manufacturerOrderSchema");
const WholesalerProduct = require("./models/wholesalerProductSchema");
const WholesalerOrder = require("./models/wholesalerOrderSchema");
const PharmacyProduct = require("./models/pharmacyProductSchema");
const PharmacyOrder = require("./models/pharmacyOrderSchema");

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

mongoose.connect('mongodb://127.0.0.1:27017/pharmacy_db',{
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Error connecting to MongoDB:', err));

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }
    jwt.verify(token, 'secret', (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
      }

      req.userId = decoded.userId;
      req.username = decoded.username;
      next();
    });
  };


app.get("/",(req,res) =>{
    res.send("hello");
});

app.post('/register', async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        let existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            role
        });

        await newUser.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
 
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        const token = jwt.sign({ userId: user._id }, "secret");
        res.status(200).json({ token,type:user.role });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

app.post('/add/raw-materials',verifyToken, async (req, res) => {
    console.log("hello")
    try {
        const { name, photo, price, description,quantityAvailable } = req.body;
        const supplier = req.userId;

        const rawMaterial = new RawMaterial({
            name,
            photo,
            price,
            description,
            quantityAvailable,
            supplier
        });

        await rawMaterial.save();

        res.json({ success: true, message: 'Raw material added successfully' });
    } catch (error) {
        console.error('Error adding raw material:', error);
        res.status(500).json({ success: false, message: 'Failed to add raw material' });
    }
});

app.get('/get/raw-materials',verifyToken, async (req, res) => {
    try {
        const userId = req.userId;

        const rawMaterials = await RawMaterial.find({ supplier: userId });

        res.json({ success: true, rawMaterials });
    } catch (error) {
        console.error('Error retrieving raw materials:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve raw materials' });
    }
});

app.get('/suppliers/orders', verifyToken,async (req, res) => {
    try {
        const orders = await Order.find({ seller: req.userId })
            .populate({
                path: 'buyer',
                select: 'username email'
            })
            .populate({
                path: 'items',
                select: 'name price photo'
            });

        // Manually populate the items details
        for (let order of orders) {
            const populatedItems = await RawMaterial.find({ _id: { $in: order.items } }, 'name price photo');
            order.items = populatedItems;
        }
     

        res.json({ success: true, orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch orders' });
    }
});

app.put('/orders', async (req, res) => {
    try {
        const { orderId, status } = req.body;
    

        const updatedOrder = await Order.findByIdAndUpdate(orderId, { status }, { new: true });

        if (updatedOrder) {
            res.json({ success: true, order: updatedOrder });
        } else {
            res.status(404).json({ success: false, message: 'Order not found' });
        }
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ success: false, message: 'Failed to update order status' });
    }
});

//manufacturer
app.get('/manufactures/raw-materials',async (req, res) => {
    try {
       
        const rawMaterials = await RawMaterial.find();

        res.json({ success: true, rawMaterials });
    } catch (error) {
        console.error('Error retrieving raw materials:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve raw materials' });
    }
});

app.get('/manufactures/products', verifyToken,async (req, res) => {
    try {
        const products = await Product.find({manufacturer:req.userId});
        console.log(products)
        res.json({ success: true, products });
    } catch (error) {
        console.error('Error retrieving raw materials:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve raw materials' });
    }
});

app.post('/manufactures/add-products', verifyToken, async (req, res) => {
    try {
        const { name, photo, price, expiryDate, manufacturerDate } = req.body;
        const manufacturer = req.userId

        const newProduct = new Product({
            name,
            photo,
            price,
            expiryDate,
            manufacturerDate,
            manufacturer
        });

        const savedProduct = await newProduct.save();

        res.status(201).json({ success: true, product: savedProduct });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ success: false, message: 'Failed to add product' });
    }
});

app.post('/order-raw-materials', verifyToken, async (req, res) => {
    try {
        const { sellerId, items } = req.body;
        const buyerId = req.userId;

        const itemsArray = Array.isArray(items) ? items : [items];

        console.log(req.body);

        // Find existing order based on buyer and seller
        let existingOrder = await Order.findOne({ buyer: buyerId, seller: sellerId });

        if (existingOrder) {
            // If order already exists, add items to the existing order
            existingOrder.items.push(...itemsArray);
            const updatedOrder = await existingOrder.save();
            res.status(200).json({ success: true, message: 'Items added to existing order', order: updatedOrder });
        } else {
            // If order doesn't exist, create a new order
            const newOrder = new Order({
                buyer: buyerId,
                seller: sellerId,
                items: itemsArray
            });
            const savedOrder = await newOrder.save();
            res.status(201).json({ success: true, message: 'New order placed', order: savedOrder });
        }
    } catch (error) {
        console.error('Error ordering raw materials:', error);
        res.status(500).json({ success: false, message: 'Failed to order raw materials' });
    }
});

app.get('/ordered-raw-materials' ,verifyToken, async (req, res) => {
    try {

        const manufacturerId = req.userId;
        const orders = await Order.find({ buyer: manufacturerId }).populate({
            path: 'items',
            select: 'name price photo'
        });

        res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error('Error fetching ordered raw materials:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch ordered raw materials' });
    }
});

app.get('/orders-for-manufacturer',verifyToken, async (req, res) => {
    try {
        const sellerId  = req.userId;

        const orders = await ManufacturerOrder.find({ seller: sellerId }).populate('buyer').populate('item.product');
       
        const ordersData = orders.map(order => ({
            id: order._id,
            productName: order.item.product.name,
            photo: order.item.product.photo,
            quantity: order.item.quantity,
            totalPrice: order.item.quantity * order.item.product.price, 
            buyerName: order.buyer.username
        }));


        res.status(200).json(ordersData);
    } catch (error) {
        console.error('Error fetching orders by seller:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/update-order-status', async (req, res) => {
    
    const {orderId,status} = req.body;
    console.log(req.body)
    try {
        const order = await ManufacturerOrder.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.status = status;
        await order.save();

        // Send response with updated order
        res.status(200).json({ success: true, message: 'Order status updated', order });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ success: false, message: 'Failed to update order status' });
    }
});

//wholeSaler
app.get('/wholesaler-products', async (req, res) => {
    try {
        const products = await Product.find({});

        res.status(200).json({ success: true, products });
    } catch (error) {
        console.error('Error fetching wholesaler products:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch wholesaler products' });
    }
});
app.get('/wholesaler-own-orders', verifyToken, async (req, res) => {

    const  buyerId  = req.userId;

    try {
        const orders = await ManufacturerOrder.find({ buyer: buyerId }).populate('item.product');

        const orderDetails = orders.map(order => ({
            productImage: order.item.product.photo,
            name:order.item.product.name,
            productId :order.item.product._id,
            quantity: order.item.quantity,
            totalPrice: order.item.quantity * order.item.product.price,
            status: order.status
        }));

        res.status(200).json({ success: true, orders: orderDetails });
    } catch (error) {
        console.error('Error retrieving orders by buyer ID:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve orders' });
    }
});
app.get('/wholesaler-received-products', verifyToken, async (req, res) => {
    const buyerId  = req.userId;

    try {
        const orders = await ManufacturerOrder.find({ buyer: buyerId, status: 'delivered' }).populate('item.product');

        const products = orders.map(order => ({
            productName: order.item.product.name,
            productImage: order.item.product.photo,
            productId :order.item.product._id,
            manufacturer:order.item.product.manufacturer,
            quantity: order.item.quantity,
            price: order.item.product.price,
            totalPrice: order.item.quantity * order.item.product.price
        }));

        res.status(200).json({ success: true, products });
    } catch (error) {
        console.error('Error retrieving delivered products by buyer ID:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve delivered products' });
    }
});

app.post('/wholesaler-add-product', verifyToken, async (req, res) => {
    const { name, price, manufacturer, newPrice,photo } = req.body;

    try {

        const newProduct = new WholesalerProduct({
            name,
            price,
            photo,
            manufacturer,
            wholesaler: req.userId, 
            newPrice
        });

        const savedProduct = await newProduct.save();

        res.status(201).json({ success: true, message: 'Product added successfully', product: savedProduct });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ success: false, message: 'Failed to add product' });
    }
});
app.post('/add-product-to-Manufacturer-order',verifyToken, async (req, res) => {
    try {
        const { seller,product, quantity } = req.body;
        const buyer = req.userId


        const newOrder = new ManufacturerOrder({
            buyer,
            seller,
            item: {
                product,
                quantity
            },
            status: 'pending'
        });

        await newOrder.save();

        res.status(201).json({ message: 'Product added to order successfully' });
    } catch (error) {
        console.error('Error adding product to order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/orders-for-wholesalers',verifyToken, async (req, res) => {
    try {
        const sellerId  = req.userId;

        const orders = await WholesalerOrder.find({ seller: sellerId }).populate('buyer').populate('item.product');
       
        const ordersData = orders.map(order => ({
            id: order._id,
            productName: order.item.product.name,
            photo: order.item.product.photo,
            quantity: order.item.quantity,
            totalPrice: order.item.quantity * order.item.product.newPrice, 
            buyerName: order.buyer.username
        }));


        res.status(200).json(ordersData);
    } catch (error) {
        console.error('Error fetching orders by seller:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.put('/wholesaler-update-order-status', async (req, res) => {

    const {orderId,status} = req.body;
    try {
        const order = await WholesalerOrder.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.status = status;
        await order.save();

        // Send response with updated order
        res.status(200).json({ success: true, message: 'Order status updated', order });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ success: false, message: 'Failed to update order status' });
    }
});

//Pharmacy
app.get('/pharmacy-wholesaler-products', async (req, res) => {
    try {

        const products = await WholesalerProduct.find();

        res.status(200).json({ success: true, products });
    } catch (error) {
        console.error('Error fetching wholesaler products:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch wholesaler products' });
    }
});
app.post('/add-product-to-wholesaler-order',verifyToken, async (req, res) => {
    try {
        const { seller,product, quantity } = req.body;
        const buyer = req.userId


        const newOrder = new WholesalerOrder({
            buyer,
            seller,
            item: {
                product,
                quantity
            },
            status: 'pending'
        });

        await newOrder.save();

        res.status(201).json({ message: 'Product added to order successfully' });
    } catch (error) {
        console.error('Error adding product to order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/pharmacy-own-orders', verifyToken, async (req, res) => {

    const  buyerId  = req.userId;

    try {
        const orders = await WholesalerOrder.find({ buyer: buyerId }).populate('item.product');

        const orderDetails = orders.map(order => ({
            productImage: order.item.product.photo,
            name:order.item.product.name,
            productId :order.item.product._id,
            quantity: order.item.quantity,
            totalPrice: order.item.quantity * order.item.product.newPrice,
            status: order.status
        }));

        res.status(200).json({ success: true, orders: orderDetails });
    } catch (error) {
        console.error('Error retrieving orders by buyer ID:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve orders' });
    }
});
app.get('/pharmacy-received-products', verifyToken, async (req, res) => {
    const buyerId  = req.userId;

    try {
        const orders = await WholesalerOrder.find({ buyer: buyerId, status: 'delivered' }).populate('item.product');

        const products = orders.map(order => ({
            productName: order.item.product.name,
            productImage: order.item.product.photo,
            productId :order.item.product._id,
            manufacturer:order.item.product.manufacturer,
            wholesaler:order.item.product.wholesaler,
            quantity: order.item.quantity,
            price: order.item.product.price,
            newPrice:order.item.product.newPrice,
            totalPrice: order.item.quantity * order.item.product.newPrice
        }));
        res.status(200).json({ success: true, products });
    } catch (error) {
        console.error('Error retrieving delivered products by buyer ID:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve delivered products' });
    }
});
app.post('/pharmacy-add-product', verifyToken, async (req, res) => {
    const { name, price,quantity, manufacturer,wholesaler, newPrice,photo,finalPrice } = req.body;

    try {

        const newProduct = new PharmacyProduct({
            name,
            price,
            photo,
            manufacturer,
            wholesaler,
            newPrice,
            finalPrice,
            quantity,
            pharmacy:req.userId
        });

        const savedProduct = await newProduct.save();

        res.status(201).json({ success: true, message: 'Product added successfully', product: savedProduct });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ success: false, message: 'Failed to add product' });
    }
});
app.get('/orders-for-pharmacy',verifyToken, async (req, res) => {
    try {
        const sellerId  = req.userId;

        const orders = await PharmacyOrder.find({ seller: sellerId }).populate('buyer').populate('item.product');
       
        const ordersData = orders.map(order => ({
            id: order._id,
            productName: order.item.product.name,
            photo: order.item.product.photo,
            quantity: order.item.quantity,
            totalPrice: order.item.quantity * order.item.product.finalPrice, 
            buyerName: order.buyer.username
        }));


        res.status(200).json(ordersData);
    } catch (error) {
        console.error('Error fetching orders by seller:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.put('/pharmacy-update-order-status', async (req, res) => {

    const {orderId,status} = req.body;
    try {
        const order = await PharmacyOrder.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.status = status;
        await order.save();

        // Send response with updated order
        res.status(200).json({ success: true, message: 'Order status updated', order });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ success: false, message: 'Failed to update order status' });
    }
});



//Customer
app.get('/customer-pharmacy-products', async (req, res) => {
    try {

        const products = await PharmacyProduct.find();

        res.status(200).json({ success: true, products });
    } catch (error) {
        console.error('Error fetching wholesaler products:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch wholesaler products' });
    }
});

app.post('/add-product-to-pharmacy-order',verifyToken, async (req, res) => {
    try {
        const { seller,product, quantity } = req.body;
        const buyer = req.userId


        const newOrder = new PharmacyOrder({
            buyer,
            seller,
            item: {
                product,
                quantity
            },
            status: 'pending'
        });

        await newOrder.save();

        res.status(201).json({ message: 'Product added to order successfully' });
    } catch (error) {
        console.error('Error adding product to order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/customer-own-orders', verifyToken, async (req, res) => {

    const  buyerId  = req.userId;

    try {
        const orders = await PharmacyOrder.find({ buyer: buyerId }).populate('item.product');

        const orderDetails = orders.map(order => ({
            productImage: order.item.product.photo,
            name:order.item.product.name,
            productId :order.item.product._id,
            quantity: order.item.quantity,
            totalPrice: order.item.quantity * order.item.product.finalPrice,
            status: order.status
        }));

        res.status(200).json({ success: true, orders: orderDetails });
    } catch (error) {
        console.error('Error retrieving orders by buyer ID:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve orders' });
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
