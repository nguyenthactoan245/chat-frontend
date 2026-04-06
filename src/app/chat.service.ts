import { Injectable } from '@angular/core';
import { SocketService } from './socket.service';

export interface Message {
  content: string;
  username: string;
  createdAt: Date;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  constructor(private socketService: SocketService) {}

  sendMessage(content: string, senderId: number, username: string) {
    this.socketService.emit('sendMessage', { content, senderId, username });
  }

  getMessageHistory() {
    this.socketService.emit('getMessages', {});
  }

  // Thông báo với server mình đang online
  notifyOnline(username: string, userId: number) {
    this.socketService.emit('userOnline', { username, userId });
  }

  // Lắng nghe danh sách online
  onOnlineUsers(callback: (users: { username: string; userId: number }[]) => void) {
    this.socketService.on('onlineUsers', callback);
  }

  onNewMessage(callback: (msg: Message) => void) {
    this.socketService.on('newMessage', callback);
  }

  onMessageHistory(callback: (msgs: Message[]) => void) {
    this.socketService.on('messageHistory', callback);
  }

  removeListeners() {
    this.socketService.off('newMessage');
    this.socketService.off('messageHistory');
    this.socketService.off('onlineUsers');
  }
}