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
  styleUrl: './chat.css',
})
export class ChatComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  newMessage = '';
  currentUsername = '';
  currentUserId = 0;
  onlineUsers: { username: string; userId: number }[] = [];
  selectedUser: { username: string; userId: number } | null = null;

  // ← thêm: đếm tin nhắn chưa đọc theo userId
  unreadCount: { [userId: number]: number } = {};

  // ← thêm property
  botMessages: any[] = [];
  isBotSelected = false;

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

    this.chatService.onNewPrivateMessage((msg: any) => {
      const isFromSelectedUser =
        this.selectedUser && msg.username === this.selectedUser.username;

      if (isFromSelectedUser) {
        // Đang chat với người này → hiện tin nhắn luôn
        this.messages.push(msg);
        this.scrollToBottom();
      } else if (msg.username !== this.currentUsername) {
        // Tin từ người khác → tăng badge
        const sender = this.onlineUsers.find(u => u.username === msg.username);
        if (sender) {
          this.unreadCount[sender.userId] = (this.unreadCount[sender.userId] || 0) + 1;
          // Đổi tiêu đề tab
          const total = this.getTotalUnread();
          document.title = total > 0 ? `(${total}) Chat App` : 'Chat App';
        }
      }

      this.cdr.detectChanges();
    });

    this.chatService.onPrivateMessageHistory((msgs) => {
      this.messages = msgs;
      this.cdr.detectChanges();
      this.scrollToBottom();
    });

    this.chatService.onNewBotMessage((msg) => {
      this.botMessages.push(msg);
      this.cdr.detectChanges();
      this.scrollToBottom();
    });
  }

  ngOnDestroy() {
    this.chatService.removeListeners();
    this.socketService.disconnect();
    document.title = 'Chat App';
  }

  selectUser(user: { username: string; userId: number }) {
    if (user.userId === this.currentUserId) return;
    this.selectedUser = user;
    this.isBotSelected = false;   // ← thêm
    this.messages = [];
    this.unreadCount[user.userId] = 0;
    const total = this.getTotalUnread();
    document.title = total > 0 ? `(${total}) Chat App` : 'Chat App';
    this.chatService.getPrivateMessages(this.currentUserId, user.userId);
    this.cdr.detectChanges();
  }

  getTotalUnread(): number {
    return Object.values(this.unreadCount).reduce((a, b) => a + b, 0);
  }

sendMessage() {
  if (!this.newMessage.trim()) return;

  if (this.isBotSelected) {
    this.chatService.sendBotMessage(
      this.newMessage,
      this.currentUsername,
      this.currentUserId,
    );
    this.newMessage = '';
    return;
  }

  if (!this.selectedUser) return;
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

  selectBot() {
    this.selectedUser = null;
    this.isBotSelected = true;
    this.botMessages = [];
    this.cdr.detectChanges();
  }

  getAvatarColor(name: string): string {
    const colors = ['#0084ff', '#e91e8c', '#f7630c', '#00a400', '#9c27b0', '#e53935', '#00838f'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }

  logout() {
    this.authService.logout();
    this.socketService.disconnect();
    document.title = 'Chat App';
    this.router.navigate(['/login']);
  }
}