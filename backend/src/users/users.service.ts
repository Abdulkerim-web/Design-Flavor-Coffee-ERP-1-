import { Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { User } from "../entities/user.entity"

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      relations: ["role"],
    })
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id }, relations: ["role"] })
  }

  /**
   * Deactivates a user, preventing them from logging in but preserving history.
   */
  async deactivateUser(userId: string, deactivatedById: string): Promise<User> {
    const user = await this.findById(userId)
    if (!user) {
      throw new NotFoundException("User not found")
    }

    user.status = "disabled"
    user.deactivatedAt = new Date()
    user.deactivatedBy = deactivatedById

    return this.usersRepository.save(user)
  }

  async activateUser(userId: string): Promise<User> {
    const user = await this.findById(userId)
    if (!user) {
      throw new NotFoundException("User not found")
    }

    user.status = "active"
    user.deactivatedAt = null
    user.deactivatedBy = null

    return this.usersRepository.save(user)
  }
}
