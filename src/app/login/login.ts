import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
})
export class LoginComponent {
  username = '';
  password = '';
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  login() {
    if (!this.username.trim() || !this.password.trim()) {
      this.errorMessage = 'Vui lòng nhập đầy đủ thông tin';
      return;
    }

    this.authService.login(this.username, this.password).subscribe({
      next: (res) => {
        this.authService.saveSession(res.token, res.username, res.userId);
        this.router.navigate(['/chat']);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Đăng nhập thất bại';
        this.cdr.detectChanges();
      },
    });
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}