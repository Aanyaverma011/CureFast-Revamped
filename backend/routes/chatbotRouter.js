import express from 'express';
import { chatWithAssistant } from '../controllers/chatbotController.js';

const chatbotRouter = express.Router();

chatbotRouter.post('/', chatWithAssistant);

export default chatbotRouter;