import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { isValidNationalId } from '../utils/rut.util';

export function IsNationalId(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isNationalId',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: 'El identificador debe ser un RUT chileno válido (ej: 15420312-K) o documento oficial válido.',
        ...validationOptions,
      },
      validator: {
        validate(value: any, _args: ValidationArguments) {
          return typeof value === 'string' && isValidNationalId(value);
        },
      },
    });
  };
}
