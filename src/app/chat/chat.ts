import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth';
import { ChatService, Message } from '../chat.service';
import { SocketService } from '../socket.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
})
export class ChatComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  newMessage = '';
  currentUsername = '';
  currentUserId = 0;
  onlineUsers: { username: string; userId: number }[] = [];

  @ViewChild('messageContainer') messageContainer!: ElementRef;

  constructor(
    private authService: AuthService,
    private chatService: ChatService,
    private socketService: SocketService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.currentUsername = this.authService.getUsername() || '';
    this.currentUserId = this.authService.getUserId();

    this.socketService.connect();

    // Thông báo online sau khi kết nối
    this.chatService.notifyOnline(this.currentUsername, this.currentUserId);

    // Lắng nghe danh sách online
    this.chatService.onOnlineUsers((users: { username: string; userId: number }[]) => {
      this.onlineUsers = users;
      this.cdr.detectChanges();
    });

    this.chatService.onMessageHistory((msgs) => {
      this.messages = msgs;
      this.cdr.detectChanges();
      this.scrollToBottom();
    });

    this.chatService.onNewMessage((msg) => {
      this.messages.push(msg);
      this.cdr.detectChanges();
      this.scrollToBottom();
    });

    this.chatService.getMessageHistory();
  }

  ngOnDestroy() {
    this.chatService.removeListeners();
    this.socketService.disconnect();
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;
    this.chatService.sendMessage(this.newMessage, this.currentUserId, this.currentUsername);
    this.newMessage = '';
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') this.sendMessage();
  }

  scrollToBottom() {
    setTimeout(() => {
      if (this.messageContainer) {
        this.messageContainer.nativeElement.scrollTop =
          this.messageContainer.nativeElement.scrollHeight;
      }
    }, 50);
  }

  logout() {
    this.authService.logout();
    this.socketService.disconnect();
    this.router.navigate(['/login']);
  }
}