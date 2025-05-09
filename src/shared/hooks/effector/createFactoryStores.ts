import { 
  createStore, 
  createEvent, 
  sample, 
  createEffect, 
  Effect, 
  Event, 
  Store 
} from 'effector';

import { isMockMode, createMockData } from '../../utils/convex';

/**
 * Тип для описания CRUD операций для сущности
 */
export interface EntityCrudOperations<T, ID = string> {
  // Сторы
  $entities: Store<Record<string, T>>;
  $loading: Store<boolean>;
  $error: Store<string | null>;
  $selectedId: Store<ID | null>;
  
  // События
  entityAdded: Event<T>;
  entityRemoved: Event<ID>;
  entityUpdated: Event<{id: ID, updates: Partial<T>}>;
  setEntities: Event<Record<string, T>>;
  selectEntity: Event<ID | null>;
  
  // Эффекты
  fetchEntitiesFx: Effect<void, Record<string, T>, Error>;
  addEntityFx: Effect<T, T, Error>;
  removeEntityFx: Effect<ID, ID, Error>;
  updateEntityFx: Effect<{id: ID, updates: Partial<T>}, T, Error>;
  fetchEntityByIdFx: Effect<ID, T, Error>;
}

/**
 * Функция для создания типовых CRUD операций для сущности с расширенными возможностями
 * 
 * @param name - Имя сущности для использования в названиях сторов и событий
 * @param initialState - Начальное состояние хранилища
 * @param api - Объект с функциями API для выполнения CRUD операций
 * @param options - Дополнительные опции для настройки создаваемых сторов
 * @returns Объект с сторами, событиями и эффектами для работы с сущностью
 */
export function createEntityCrudOperations<T extends { id: ID }, ID = string>(
  name: string,
  initialState: Record<string, T> = {},
  api?: {
    fetch?: () => Promise<Record<string, T> | T[]>,
    fetchById?: (id: ID) => Promise<T>,
    add?: (entity: T) => Promise<T>,
    remove?: (id: ID) => Promise<ID>,
    update?: (params: {id: ID, updates: Partial<T>}) => Promise<T>
  },
  options?: {
    mockData?: {
      entities?: Record<string, T> | T[],
      entityById?: T
    },
    debug?: boolean
  }
): EntityCrudOperations<T, ID> {
  const { mockData, debug = false } = options || {};
  
  // Создаем сторы
  const $entities = createStore<Record<string, T>>(initialState, { name: `$${name}Entities` });
  const $loading = createStore(false, { name: `$${name}Loading` });
  const $error = createStore<string | null>(null, { name: `$${name}Error` });
  const $selectedId = createStore<ID | null>(null, { name: `$${name}SelectedId` });
  
  // Создаем события
  const entityAdded = createEvent<T>({ name: `${name}Added` });
  const entityRemoved = createEvent<ID>({ name: `${name}Removed` });
  const entityUpdated = createEvent<{id: ID, updates: Partial<T>}>({ name: `${name}Updated` });
  const setEntities = createEvent<Record<string, T>>({ name: `set${name}Entities` });
  const selectEntity = createEvent<ID | null>({ name: `select${name}` });
  
  // Преобразование массива сущностей в объект
  const arrayToRecord = (items: T[]): Record<string, T> => {
    return items.reduce((acc, item) => {
      acc[item.id as unknown as string] = item;
      return acc;
    }, {} as Record<string, T>);
  };

  // Создаем эффекты для взаимодействия с API
  const fetchEntitiesFx = createEffect<void, Record<string, T>, Error>({
    name: `fetch${name}Fx`,
    handler: async () => {
      if (debug) console.log(`Fetching ${name} entities...`);
      
      if (isMockMode() && mockData?.entities) {
        if (debug) console.log(`Using mock data for ${name} entities`);
        const mockEntities = mockData.entities;
        const result = Array.isArray(mockEntities) ? arrayToRecord(mockEntities) : mockEntities;
        return await createMockData(result);
      }
      
      if (!api?.fetch) {
        throw new Error(`No fetch method provided for ${name} entities`);
      }
      
      const result = await api.fetch();
      
      // Обрабатываем случай, когда API возвращает массив вместо объекта
      if (Array.isArray(result)) {
        return arrayToRecord(result);
      }
      
      return result;
    }
  });
  
  const fetchEntityByIdFx = createEffect<ID, T, Error>({
    name: `fetch${name}ByIdFx`,
    handler: async (id) => {
      if (debug) console.log(`Fetching ${name} entity by id: ${String(id)}...`);
      
      if (isMockMode() && mockData?.entityById) {
        if (debug) console.log(`Using mock data for ${name} entity by id: ${String(id)}`);
        return await createMockData(mockData.entityById);
      }
      
      if (!api?.fetchById) {
        throw new Error(`No fetchById method provided for ${name} entity`);
      }
      
      return await api.fetchById(id);
    }
  });
  
  const addEntityFx = createEffect<T, T, Error>({
    name: `add${name}Fx`,
    handler: async (entity) => {
      if (debug) console.log(`Adding ${name} entity:`, entity);
      
      if (isMockMode()) {
        if (debug) console.log(`Using mock mode for adding ${name} entity`);
        return await createMockData(entity);
      }
      
      if (!api?.add) {
        throw new Error(`No add method provided for ${name} entity`);
      }
      
      return await api.add(entity);
    }
  });
  
  const removeEntityFx = createEffect<ID, ID, Error>({
    name: `remove${name}Fx`,
    handler: async (id) => {
      if (debug) console.log(`Removing ${name} entity with id: ${String(id)}`);
      
      if (isMockMode()) {
        if (debug) console.log(`Using mock mode for removing ${name} entity with id: ${String(id)}`);
        return await createMockData(id);
      }
      
      if (!api?.remove) {
        throw new Error(`No remove method provided for ${name} entity`);
      }
      
      return await api.remove(id);
    }
  });
  
  const updateEntityFx = createEffect<{id: ID, updates: Partial<T>}, T, Error>({
    name: `update${name}Fx`,
    handler: async ({id, updates}) => {
      if (debug) console.log(`Updating ${name} entity with id: ${String(id)}`, updates);
      
      if (isMockMode()) {
        if (debug) console.log(`Using mock mode for updating ${name} entity with id: ${String(id)}`);
        
        // Создаем копию обновленной сущности из текущего состояния
        const entity = $entities.getState()[id as unknown as string];
        const updatedEntity = {...entity, ...updates} as T;
        
        return await createMockData(updatedEntity);
      }
      
      if (!api?.update) {
        throw new Error(`No update method provided for ${name} entity`);
      }
      
      return await api.update({id, updates});
    }
  });
  
  // Настраиваем реакции на события и эффекты
  
  // Управление выбранной сущностью
  $selectedId.on(selectEntity, (_, selectedId) => selectedId);
  
  // Управление состоянием загрузки
  $loading
    .on(fetchEntitiesFx.pending, (_, isPending) => isPending)
    .on(addEntityFx.pending, (_, isPending) => isPending)
    .on(removeEntityFx.pending, (_, isPending) => isPending)
    .on(updateEntityFx.pending, (_, isPending) => isPending)
    .on(fetchEntityByIdFx.pending, (_, isPending) => isPending);
  
  // Управление состоянием ошибки
  $error
    .on(fetchEntitiesFx.failData, (_, error) => error.message)
    .on(addEntityFx.failData, (_, error) => error.message)
    .on(removeEntityFx.failData, (_, error) => error.message)
    .on(updateEntityFx.failData, (_, error) => error.message)
    .on(fetchEntityByIdFx.failData, (_, error) => error.message)
    .reset(fetchEntitiesFx)
    .reset(addEntityFx)
    .reset(removeEntityFx)
    .reset(updateEntityFx)
    .reset(fetchEntityByIdFx);
  
  // Обновляем хранилище сущностей
  $entities
    .on(setEntities, (_, newEntities) => newEntities)
    .on(fetchEntitiesFx.doneData, (_, entities) => entities)
    .on(entityAdded, (state, entity) => ({
      ...state,
      [entity.id as unknown as string]: entity
    }))
    .on(addEntityFx.doneData, (state, entity) => ({
      ...state,
      [entity.id as unknown as string]: entity
    }))
    .on(entityRemoved, (state, id) => {
      const newState = {...state};
      delete newState[id as unknown as string];
      return newState;
    })
    .on(removeEntityFx.doneData, (state, id) => {
      const newState = {...state};
      delete newState[id as unknown as string];
      return newState;
    })
    .on(entityUpdated, (state, {id, updates}) => ({
      ...state,
      [id as unknown as string]: {...state[id as unknown as string], ...updates}
    }))
    .on(updateEntityFx.doneData, (state, entity) => ({
      ...state,
      [entity.id as unknown as string]: entity
    }))
    .on(fetchEntityByIdFx.doneData, (state, entity) => ({
      ...state,
      [entity.id as unknown as string]: entity
    }));
  
  // Связываем события с эффектами
  sample({
    clock: entityAdded,
    target: addEntityFx
  });
  
  sample({
    clock: entityRemoved,
    target: removeEntityFx
  });
  
  sample({
    clock: entityUpdated,
    target: updateEntityFx
  });
  
  // Возвращаем объект с созданными сторами, событиями и эффектами
  return {
    // Сторы
    $entities,
    $loading,
    $error,
    $selectedId,
    
    // События
    entityAdded,
    entityRemoved,
    entityUpdated,
    setEntities,
    selectEntity,
    
    // Эффекты
    fetchEntitiesFx,
    addEntityFx,
    removeEntityFx,
    updateEntityFx,
    fetchEntityByIdFx
  };
} 