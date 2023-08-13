import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostEntity } from './entities/post.entity';
import { SearchPostDto } from './dto/searchg-post.dto';

// Алиас - это короткое имя или псевдоним, который вы присваиваете сущности (таблице)
// в SQL-запросе. Это позволяет ссылаться на данную сущность с использованием
// этого алиаса вместо полного имени таблицы, что улучшает читаемость
//и делает код более компактным, особенно когда в запросах есть много условий и объединений.
// и уменьшает дублирование кода, особенно при использовании JOIN и других операций,
//которые объединяют несколько таблиц.

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(PostEntity)
    private repository: Repository<PostEntity>,
  ) {}

  // 1.endpoints:findAll
  findAll() {
    return this.repository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  // 2.endpoints:popular
  async popular() {
    const qb = this.repository.createQueryBuilder();

    qb.orderBy('views', 'DESC');
    qb.limit(10);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
    };
  }

  // 3.endpoints:search
  async search(dto: SearchPostDto) {
    const qb = this.repository.createQueryBuilder('p');

    qb.leftJoinAndSelect('p.user', 'user');

    qb.limit(dto.limit || 0);
    qb.take(dto.take || 10);

    if (dto.views) {
      qb.orderBy('views', dto.views);
    }

    if (dto.body) {
      qb.andWhere(`p.body ILIKE :body`);
    }

    if (dto.title) {
      qb.andWhere(`p.title ILIKE :title`);
    }

    if (dto.tag) {
      qb.andWhere(`p.tags ILIKE :tag`);
    }

    qb.setParameters({
      title: `%${dto.title}%`,
      body: `%${dto.body}%`,
      tag: `%${dto.tag}%`,
      views: dto.views || '',
    });

    const [items, total] = await qb.getManyAndCount();

    return { items, total };
  }

  // 4.endpoints:findOne - поиск поста по id
  async findOne(id: number) {
    // если юзер открыл пост, то  увеличиваем views на 1
    await this.repository
      .createQueryBuilder('posts') // создали квери билдер
      .whereInIds(id) // указываем что мы хотим обновить запись по id
      .update() // обновляет
      .set({
        views: () => 'views + 1', // увеличиваем views на 1
      })
      .execute(); // выполняет обновление в БД

    return this.repository.findOne(id);
  }

  // 5.endpoints:create
  create(dto: CreatePostDto, userId: number) {
    const firstParagraph = dto.body.find((obj) => obj.type === 'paragraph')
      ?.data?.text;
    return this.repository.save({
      title: dto.title,
      body: dto.body,
      tags: dto.tags,
      user: { id: userId },
      description: firstParagraph || '',
    });
  }

  // 6.endpoints:update
  async update(id: number, dto: UpdatePostDto, userId: number) {
    const find = await this.repository.findOne(+id);

    if (!find) {
      throw new NotFoundException('Статья не найдена');
    }

    const firstParagraph = dto.body.find((obj) => obj.type === 'paragraph')
      ?.data?.text;

    return this.repository.update(id, {
      title: dto.title,
      body: dto.body,
      tags: dto.tags,
      user: { id: userId },
      description: firstParagraph || '',
    });
  }

  // 7.endpoints:remove
  async remove(id: number, userId: number) {
    const find = await this.repository.findOne(+id);

    if (!find) {
      throw new NotFoundException('Статья не найдена');
    }

    if (find.user.id !== userId) {
      throw new ForbiddenException('Нет доступа к этой статье!');
    }

    return this.repository.delete(id);
  }
}
