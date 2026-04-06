import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
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

  // ← thêm: người đang được chọn để chat riêng
  selectedUser: { username: string; userId: number } | null = null;

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
    this.chatService.notifyOnline(this.currentUsername, this.currentUserId);

    this.chatService.onOnlineUsers((users: { username: string; userId: number }[]) => {
      this.onlineUsers = users;
      this.cdr.detectChanges();
    });

    // Lắng nghe tin nhắn riêng mới
    this.chatService.onNewPrivateMessage((msg) => {
      // Chỉ hiện nếu đang chat với người đó
      if (
        this.selectedUser &&
        (msg.username === this.selectedUser.username ||
          msg.username === this.currentUsername)
      ) {
        this.messages.push(msg);
        this.cdr.detectChanges();
        this.scrollToBottom();
      }
    });

    // Lắng nghe lịch sử chat riêng
    this.chatService.onPrivateMessageHistory((msgs) => {
      this.messages = msgs;
      this.cdr.detectChanges();
      this.scrollToBottom();
    });
  }

  ngOnDestroy() {
    this.chatService.removeListeners();
    this.socketService.disconnect();
  }

  // Click vào user để mở chat riêng
  selectUser(user: { username: string; userId: number }) {
    if (user.userId === this.currentUserId) return; // không chat với chính mình
    this.selectedUser = user;
    this.messages = [];   // xóa tin nhắn cũ trên màn hình

    // Load lịch sử chat với người này
    this.chatService.getPrivateMessages(this.currentUserId, user.userId);
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedUser) return;
    this.chatService.sendPrivateMessage(
      this.newMessage,
      this.currentUserId,
      this.currentUsername,
      this.selectedUser.userId,
    );
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