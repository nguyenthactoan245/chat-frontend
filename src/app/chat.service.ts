import { Injectable } from '@angular/core';
import { SocketService } from './socket.service';

export interface Message {
  content: string;
  username: string;
  roomId?: string;
  createdAt: Date;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  constructor(private socketService: SocketService) {}

  notifyOnline(username: string, userId: number) {
    this.socketService.emit('userOnline', { username, userId });
  }

  onOnlineUsers(callback: (users: { username: string; userId: number }[]) => void) {
    this.socketService.on('onlineUsers', callback);
  }

  // Gửi tin nhắn riêng
  sendPrivateMessage(content: string, senderId: number, username: string, receiverId: number) {
    this.socketService.emit('sendPrivateMessage', { content, senderId, username, receiverId });
  }

  // Lấy lịch sử chat riêng
  getPrivateMessages(senderId: number, receiverId: number) {
    this.socketService.emit('getPrivateMessages', { senderId, receiverId });
  }

  // Lắng nghe tin nhắn riêng mới
  onNewPrivateMessage(callback: (msg: Message) => void) {
    this.socketService.on('newPrivateMessage', callback);
  }

  // Lắng nghe lịch sử chat riêng
  onPrivateMessageHistory(callback: (msgs: Message[]) => void) {
    this.socketService.on('privateMessageHistory', callback);
  }

  getConversations(userId: number) {
    this.socketService.emit('getConversations', { userId });
  }

  onConversationList(callback: (convs: any[]) => void) {
    this.socketService.on('conversationList', callback);
  }

  removeListeners() {
    this.socketService.off('newPrivateMessage');
    this.socketService.off('privateMessageHistory');
    this.socketService.off('onlineUsers');
    this.socketService.off('newBotMessage');
    this.socketService.off('conversationList');
  }

  // Gửi tin nhắn cho bot
  sendBotMessage(content: string, username: string, senderId: number) {
    this.socketService.emit('sendBotMessage', { content, username, senderId });
  }

  // Lắng nghe reply từ bot
  onNewBotMessage(callback: (msg: any) => void) {
    this.socketService.on('newBotMessage', callback);
  }

  // Hủy lắng nghe bot
  removeBotListeners() {
    this.socketService.off('newBotMessage');
  }
}