import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import Tesseract from 'tesseract.js';
import axios from 'axios';
import PDFDocument from 'pdfkit';

// --- DB setup ---
mongoose
  .connect('mongodb://localhost/travel-expense')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('MongoDB connect error:', err);
    process.exit(1);
  });

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'user' },
});
const TripSchema = new mongoose.Schema({
  name: String,
  members: [String],
  country: String,
  budget: Number,
});
const ExpenseSchema = new mongoose.Schema({
  tripId: mongoose.Schema.Types.ObjectId,
  amount: Number,
  paidBy: String,
  description: String,
  date: Date,
});
const User = mongoose.model('User', UserSchema);
const Trip = mongoose.model('Trip', TripSchema);
const Expense = mongoose.model('Expense', ExpenseSchema);

// Add Feedback Schema after other schemas
const FeedbackSchema = new mongoose.Schema({
  username: String,
  message: String,
  adminReply: String,
  createdAt: { type: Date, default: Date.now },
  repliedAt: Date,
});

const Feedback = mongoose.model('Feedback', FeedbackSchema);

const app = express();
const PORT = 5000;
app.use(cors());
app.use(express.json());

// ----------- Middleware -----------
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, 'SECRET', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// ----------- Multer for image upload -----------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only images allowed'), false);
    cb(null, true);
  },
});
function multerErrorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError || err.message?.includes('Only images allowed')) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
}

// ----------- Receipt OCR endpoint -----------
app.post(
  '/api/receipt-scan',
  authenticateToken,
  upload.single('receipt'),
  multerErrorHandler,
  async (req, res) => {
    try {
      if (!req.file) throw new Error('No file received');

      // Perform OCR with Tesseract.js
      const result = await Tesseract.recognize(req.file.buffer, 'eng');
      const text = result.data.text || '';

      // Extract amount as integer (ignore decimals)
      const amountMatch = text.match(/(?:₹|INR)?\s*(\d+)/i);
      const amount = amountMatch ? parseInt(amountMatch[1], 10) : null;

      // Extract date: formats like yyyy-mm-dd or dd-mm-yyyy, normalized to yyyy-mm-dd
      const dateMatch = text.match(/(\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2}|\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/);
      let date = null;
      if (dateMatch) {
        const d = dateMatch[1];
        if (/^\d{4}[\/\-\.]/.test(d)) {
          date = d.replace(/[\/\.]/g, '-');
        } else {
          const parts = d.split(/[-\/\.]/);
          if (parts.length === 3) {
            date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }
      }

      res.json({ text, amount, date });
    } catch (err) {
      console.error('OCR error:', err);
      res.status(500).json({ error: 'OCR failed', details: err.message });
    }
  }
);

// ----------- Auth routes -----------
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Please enter all fields' });
    const exist = await User.findOne({ username });
    if (exist) return res.status(400).json({ error: 'Username already exists' });
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashed });
    await user.save();
    res.json({ message: 'Registered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed', details: err.message });
  }
});
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: 'Invalid username or password' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid username or password' });
    const token = jwt.sign({ username: user.username, role: user.role }, 'SECRET');
    res.json({ token, isAdmin: user.role === 'admin' });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
});

// ----------- Admin routes -----------
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    // Only allow admin users to access this endpoint
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    
    const users = await User.find({}, 'username role').sort({ username: 1 });
    const usersWithAdminFlag = users.map(user => ({
      _id: user._id,
      username: user.username,
      isAdmin: user.role === 'admin'
    }));
    
    res.json(usersWithAdminFlag);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users', details: err.message });
  }
});

app.put('/api/users/:id/role', authenticateToken, async (req, res) => {
  try {
    // Only allow admin users to access this endpoint
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be "user" or "admin".' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, select: 'username role' }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      _id: user._id,
      username: user.username,
      isAdmin: user.role === 'admin'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user role', details: err.message });
  }
});

// ----------- Trip and Expenses routes -----------
app.get('/api/trips', authenticateToken, async (req, res) => {
  const trips = await Trip.find({ members: req.user.username });
  res.json(trips);
});
app.post('/api/trips', authenticateToken, async (req, res) => {
  const { name, memberUsernames, country, budget } = req.body;
  let members = Array.from(new Set([...(memberUsernames || []), req.user.username]));
  const trip = new Trip({ name, members, country, budget });
  await trip.save();
  res.json(trip);
});
app.get('/api/trips/:id', authenticateToken, async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  res.json(trip);
});
app.delete('/api/trips/:id', authenticateToken, async (req, res) => {
  await Trip.findByIdAndDelete(req.params.id);
  await Expense.deleteMany({ tripId: req.params.id });
  res.json({ message: 'Trip deleted' });
});
app.post('/api/trips/:id/add-member', authenticateToken, async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Username required' });
  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  if (trip.members.includes(username)) return res.status(400).json({ error: 'Already a member' });
  trip.members.push(username);
  await trip.save();
  res.json({ message: 'Member added', trip });
});
app.post('/api/trips/:id/remove-member', authenticateToken, async (req, res) => {
  const { username } = req.body;
  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  trip.members = trip.members.filter((m) => m !== username);
  await trip.save();
  await Expense.deleteMany({ tripId: req.params.id, paidBy: username });
  res.json({ message: 'Member removed', trip });
});
app.post('/api/trips/:id/expenses', authenticateToken, async (req, res) => {
  const { amount, paidByUsername, description, date } = req.body;
  if (!amount || !paidByUsername || !description)
    return res.status(400).json({ error: 'Fields required' });
  const expense = new Expense({
    tripId: req.params.id,
    amount: +amount,
    paidBy: paidByUsername,
    description,
    date,
  });
  await expense.save();
  res.json({ message: 'Expense added' });
});
app.get('/api/trips/:id/expenses', authenticateToken, async (req, res) => {
  const expenses = await Expense.find({ tripId: req.params.id });
  res.json(expenses);
});
app.get('/api/trips/:id/settlements', authenticateToken, async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  const expenses = await Expense.find({ tripId: req.params.id });
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  const members = trip.members;
  const paid = {};
  members.forEach((m) => (paid[m] = 0));
  expenses.forEach((e) => {
    paid[e.paidBy] = (paid[e.paidBy] || 0) + +e.amount;
  });
  const total = expenses.reduce((a, b) => a + (b.amount || 0), 0);
  const shouldPay = {};
  members.forEach((m) => (shouldPay[m] = +(total / members.length || 1)));
  const net = {};
  members.forEach((m) => (net[m] = (paid[m] || 0) - (shouldPay[m] || 0)));
  let toPay = [],
    toGet = [];
  Object.entries(net).forEach(([user, n]) =>
    n < -0.01 ? toPay.push({ user, amount: -n }) : n > 0.01 && toGet.push({ user, amount: n })
  );
  const txs = [];
  let i = 0,
    j = 0;
  while (i < toPay.length && j < toGet.length) {
    const payObj = toPay[i],
      getObj = toGet[j],
      paidAmt = Math.min(payObj.amount, getObj.amount);
    txs.push({ from: payObj.user, to: getObj.user, amount: Math.round(paidAmt * 100) / 100 });
    payObj.amount -= paidAmt;
    getObj.amount -= paidAmt;
    if (payObj.amount < 0.01) i++;
    if (getObj.amount < 0.01) j++;
  }
  res.json({ paid, shouldPay, net, settlements: txs, total: Math.round(total * 100) / 100 });
});

// --- Currency Converter example ---
app.get('/api/convert', authenticateToken, async (req, res) => {
  try {
    const { from, to, amount } = req.query;
    if (!from || !to || isNaN(amount))
      return res.status(400).json({ error: 'Missing parameters' });
    const response = await axios.get(`https://api.exchangerate.host/convert`, {
      params: { from, to, amount },
    });
    if ('success' in response.data && response.data.success === false) {
      return res.status(400).json({ error: response.data.error?.info || 'Conversion failed' });
    }
    res.json(response.data);
  } catch (err) {
    console.error(err.response?.data || err);
    res.status(500).json({ error: 'Conversion failed', details: err.message });
  }
});

// ----- Expenses PDF export endpoint -----
app.get('/api/trips/:id/expenses/pdf', authenticateToken, async (req, res) => {
  try {
    // Fetch the trip details for currency info
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    // Fetch expenses sorted by date
    const expenses = await Expense.find({ tripId: req.params.id }).sort({ date: 1 });
    if (!expenses || expenses.length === 0) {
      return res.status(404).json({ error: 'No expenses found' });
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="expenses_report.pdf"`);

    doc.pipe(res);

    // Title and trip info
    doc.fontSize(24).font('Helvetica-Bold').text('Expense Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).font('Helvetica').text(`Trip: ${trip.name}`, { align: 'center' });
    doc.fontSize(14).text(`Country: ${trip.country}`, { align: 'center' });
    doc.moveDown(1);

    // Draw horizontal line after header
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();

    // Set column positions with spacing
    const snoX = 50;
    const snoWidth = 50;
    const dateX = 110;
    const dateWidth = 70;
    const descX = 190;
    const descWidth = 220;
    const paidByX = 420;
    const paidByWidth = 90;
    const amountX = 520;
    const amountWidth = 70;
    // Get the current Y position for header row
    const headerY = doc.y + 10; // fixed vertical position for all headers
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('S.No', snoX, headerY, { width: snoWidth, align: 'center' });
    doc.text('Date', dateX, headerY, { width: dateWidth, align: 'center' });
    doc.text('Description', descX, headerY, { width: descWidth, align: 'left' });
    doc.text('Paid By', paidByX, headerY, { width: paidByWidth, align: 'center' });
    doc.text(`Amount ('$')`, amountX, headerY, { width: amountWidth, align: 'right' });
    doc.moveDown();

    // Draw line under header to visually separate
    doc.moveTo(50, doc.y).lineTo(595, doc.y).stroke();

    // Set font for table rows
    doc.font('Helvetica').fontSize(11);

    let y = doc.y + 5;
    let totalAmount = 0;

    // Loop through all expenses and add rows
    for (let i = 0; i < expenses.length; i++) {
      const exp = expenses[i];
      const dateStr = exp.date ? new Date(exp.date).toLocaleDateString() : 'N/A';
      const description = exp.description || '';
      const paidBy = exp.paidBy || '';
      const amountStr = `${'$'}${exp.amount}`;

      totalAmount += exp.amount || 0;

      // Add new page if near bottom margin to avoid clipping
      if (y > 750) {
        doc.addPage();
        y = 50;
      }

      // Draw row with alignment
      doc.text(i + 1, snoX, y, { width: snoWidth, align: 'center' });
      doc.text(dateStr, dateX, y, { width: dateWidth, align: 'center' });
      doc.text(description, descX, y, { width: descWidth, align: 'left' });
      doc.text(paidBy, paidByX, y, { width: paidByWidth, align: 'center' });
      doc.text(amountStr, amountX, y, { width: amountWidth, align: 'right' });

      y += 20;
    }

    // Draw line above total to separate
    doc.moveTo(paidByX, y + 5).lineTo(595, y + 5).stroke();

    // Draw total row with bold font and larger size
    doc.font('Helvetica-Bold').fontSize(12);
    doc.text('Total:', paidByX, y + 10, { width: paidByWidth, align: 'left' });
    doc.text(`${'$'}${totalAmount.toFixed(0)}`, amountX, y + 10, { width: amountWidth, align: 'right' });

    // Finalize PDF and end the stream
    doc.end();
  } catch (err) {
    console.error('Error generating PDF:', err);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});


// Add these routes after your existing routes

// Submit feedback (authenticated users)
app.post('/api/feedback', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Feedback message is required' });
    }

    const feedback = new Feedback({
      username: req.user.username,
      message: message.trim()
    });

    await feedback.save();
    res.json({ message: 'Feedback submitted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit feedback', details: err.message });
  }
});

// Get user's own feedbacks
app.get('/api/user/feedbacks', authenticateToken, async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ username: req.user.username })
      .sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch feedbacks', details: err.message });
  }
});

// Admin: Get all feedbacks
app.get('/api/admin/feedbacks', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    const feedbacks = await Feedback.find({}).sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch feedbacks', details: err.message });
  }
});

// Admin: Reply to feedback
app.post('/api/admin/feedbacks/:id/reply', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    const { reply } = req.body;
    if (!reply || !reply.trim()) {
      return res.status(400).json({ error: 'Reply message is required' });
    }

    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { 
        adminReply: reply.trim(),
        repliedAt: new Date()
      },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    res.json({ message: 'Reply sent successfully', feedback });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send reply', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
