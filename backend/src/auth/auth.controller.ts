import { Controller, Post, Body, UnauthorizedException, Get, Req, Headers } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(@InjectRepository(User) private readonly userRepo: Repository<User>) {}

  @Post('login')
  async login(@Body() body: any) {
    const { username, password } = body;
    
    // Query Supabase for the user by email (username field on frontend)
    const user = await this.userRepo.findOne({ where: { email: username } });

    // Since this is demo, all seeded users have 'password' as password, 
    // but we just verify the user exists in the DB for now.
    if (user && password === 'demo' || password === 'password') {
      return {
        user: {
          id: user.id,
          username: user.email,
          role: user.roleId,
          permissions: ['*'] // Simplified for demo
        },
        token: `mock-jwt-token-${user.id}`
      };
    }
    
    throw new UnauthorizedException('Invalid credentials from database');
  }

  @Get('me')
  async getProfile(@Req() request: Request, @Headers('authorization') authHeader: string) {
    if (!authHeader) {
      throw new UnauthorizedException('No token provided');
    }
    return {
      user: {
        id: 'mock-user-123',
        username: 'sales',
        role: 'sales',
        permissions: ['orders.create']
      }
    };
  }

  @Post('logout')
  async logout() {
    return { success: true };
  }
}
