import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../../database/User.entity';
import { Repository } from 'typeorm';
import { UserFriendDto } from '../dtos/userFriend.dto';
import { UserFriendEntity } from '../../database/UserFriend.entity';
import { UserOptional } from '../../types/user';
import * as fs from 'fs';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(UserFriendEntity)
    private userFriendRepository: Repository<UserFriendEntity>,
  ) {}

  async getUserInfo(id: number) {
    const res = await this.userRepository.findOne({
      where: {
        id,
      },
    });
    return res;
  }

  async addFriend({ userId, friendId }: UserFriendDto) {
    try {
      // check if user exist
      const user = await this.getUserInfo(userId);
      if (!user) return { message: 'user not exist' };

      // check if user is equal to friend
      if (friendId === userId)
        return { message: 'user and friend must not be the same' };

      // check if friend exist
      const friend = await this.getUserInfo(friendId);
      if (!friend) return { message: 'friend not exist' };

      //check if they already are friend , then remove friend
      const ifIsFriend = await this.userFriendRepository.findOne({
        where: { friend: friend, user: user },
      });
      if (ifIsFriend) {
        await this.userFriendRepository.delete(ifIsFriend);
        return { message: 'remove friend success' };
      }

      // finally add friend
      await this.userFriendRepository.save({ friend: friend, user: user });
      return { message: 'Add friend success !' };
    } catch (e) {
      console.log(e);
    }
  }

  async getFriends({ userId }: { userId: number }) {
    try {
      const user = await this.getUserInfo(userId);
      if (!user) return { message: 'user not exist' };

      const friends = await this.userFriendRepository.find({
        where: { user: user },
      });
      const fiendResponse = friends.map((friend) => friend.friend);
      return { friends: fiendResponse };
    } catch (e) {
      console.log(e);
    }
  }

  async updateProfile(userInformation: UserOptional) {
    await this.userRepository.update(userInformation.id, {
      email: userInformation.email,
      firstName: userInformation.firstName,
      lastName: userInformation.lastName,
      location: userInformation.location,
      occupation: userInformation.occupation,
    });

    return { message: 'update user success !' };
  }

  async updateAvatar({ id, picturePath }: { id: number; picturePath: string }) {
    const user = await this.getUserInfo(id);
    if (user.picturePath !== picturePath) {
      fs.unlinkSync(`/${user.picturePath}`);
    }

    await this.userRepository.update(id, { picturePath });
    return { message: 'update avatar success' };
  }
}