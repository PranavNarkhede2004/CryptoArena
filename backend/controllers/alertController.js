import Alert from '../models/Alert.js';

export const getAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.status(200).json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createAlert = async (req, res) => {
  try {
    const { symbol, condition, targetPrice } = req.body;
    const alert = await Alert.create({
      userId: req.user.userId,
      symbol,
      condition,
      targetPrice
    });
    res.status(201).json(alert);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAlert = async (req, res) => {
  try {
    await Alert.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    res.status(200).json({ message: 'Alert deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markAlertTriggered = async (req, res) => {
  try {
    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { isActive: false, triggeredAt: new Date() },
      { new: true }
    );
    res.status(200).json(alert);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
