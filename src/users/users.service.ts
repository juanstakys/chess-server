import { Injectable } from '@nestjs/common';
import { User } from 'src/interfaces/user.interface';

@Injectable()
export class UsersService {
  private readonly users: User[] = [
    {
      username: 'juancho123',
      displayName: 'Juan Chorizo',
    },
    {
      username: 'pepe777',
      displayName: 'Pepe Vera',
    },
  ];

  findAll(): User[] {
    return this.users;
  }
}
