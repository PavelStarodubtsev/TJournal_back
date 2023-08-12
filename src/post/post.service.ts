/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEntity } from './entities/post.entity';
import { Repository } from 'typeorm';
import { SearchPostDto } from './dto/search-post-dto';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(PostEntity)
    private repository: Repository<PostEntity>,
  ) {}

  // 1.endpoints:create
  create(dto: CreatePostDto) {
    return this.repository.save(dto);
  }

  // 2.endpoints:findAll
  findAll() {
    return this.repository.find({
      // будет возвращать все статьи по дате создания от новыйх к старым
      order: {
        createdAt: 'DESC',
      },
    });
  }

  // 3.endpoints:popular
  async popular() {
    const qb = await this.repository.createQueryBuilder();
    // создали квери билдер , получим отсортированные статьи
    // по просмотрам и по возрастанию
    qb.orderBy('views', 'DESC');
    // установили лимит ,вернет массив только из 10 самых популярный статей
    qb.limit(10);

    // получаем массив всех постов и их кол-во
    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
    };
  }

  // 4.endpoints:search
  async search(dto: SearchPostDto) {
    // создали квери билдер
    const qb = await this.repository.createQueryBuilder('p');
    // 'p' - это алиас, пока не знаю для чего он точно нужен
    // по дефолту limit post  0 шт
    qb.limit(dto.limit || 0);

    // кол-во записей, котрые хотим получить
    qb.take(dto.take || 10);

    // сортировка по просмотрам
    if (dto.views) {
      qb.orderBy('views', dto.views);
    }

    // если я правильно понял ,мы будем через поиск искать пост
    // содрежащий значение введенное нами в инпут
    if (dto.body) {
      qb.andWhere(`p.body ILIKE :body`);
    }

    // если я правильно понял ,мы будем через поиск искать пост
    // содрежащий в заголовке значение введенное нами в инпут
    if (dto.title) {
      qb.andWhere(`p.title ILIKE :title`);
    }

    // если я правильно понял ,мы будем через поиск искать пост
    // содрежащий в tags значение введенное нами в инпут
    if (dto.tag) {
      qb.andWhere(`p.tags ILIKE :tag`);
    }

    // смотрел как сгенерирован SQL-запроса в базу данных
    // console.log(qb.getSql());

    qb.setParameters({
      title: `%${dto.title}%`,
      body: `%${dto.body}%`,
      tag: `%${dto.tag}%`,
      views: dto.views || '',
    });

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
    };
  }

  //   5.endpoints:findOne - поиск поста по id
  async findOne(id: number) {
    // если юзер открыл пост, то  увеличиваем views на 1
    const find = await this.repository
      .createQueryBuilder('posts') // создали квери билдер
      .whereInIds(id) // указываем что мы хотим обновить запись по id
      .update() // обновляет
      .set({
        views: () => 'views + 1', // увеличиваем views на 1
      })
      .returning('*') // Возвращаем обновленную запись
      .execute(); // выполняет обновление в БД

    if (!find) {
      throw new NotFoundException('Статья не найдена');
    }

    return find.raw[0];
  }

  // 6.endpoints:update
  async update(id: number, dto: UpdatePostDto) {
    // @ts-ignore
    const find = await this.repository.findOne(+id);
    if (!find) {
      throw new NotFoundException('Статья не найдена');
    }
    return this.repository.update(id, dto);
  }

  // 7.endpoints:remove
  async remove(id: number) {
    // @ts-ignore
    const find = await this.repository.findOne(+id);
    if (!find) {
      throw new NotFoundException('Статья не найдена');
    }
    return this.repository.delete(id);
  }
}
