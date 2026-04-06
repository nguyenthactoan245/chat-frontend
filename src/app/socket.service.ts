import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket!: Socket;

  // Kết nối đến NestJS WebSocket
  connect() {
    this.socket = io('http://localhost:3000');
  }

  // Ngắt kết nối
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  // Gửi event lên server
  emit(event: string, data: any) {
    this.socket.emit(event, data);
  }

  // Lắng nghe event từ server
  on(event: string, callback: (data: any) => void) {
    this.socket.on(event, callback);
  }

  // Hủy lắng nghe event
  off(event: string) {
    this.socket.off(event);
  }
}