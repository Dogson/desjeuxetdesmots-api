import {PipeTransform, Injectable, ArgumentMetadata, BadRequestException} from '@nestjs/common';
import {validate, ValidationError} from 'class-validator';
import {plainToClass} from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
    async transform(value: any, metadata: ArgumentMetadata) {
        if (value instanceof Object && this.isEmpty(value)) {
            throw new BadRequestException('Validation failed: no body submitted');
        }
        const {metatype} = metadata;
        if (!metatype || !this.toValidate(metatype)) {
            return value;
        }
        const object = plainToClass(metatype, value);
        const errors: ValidationError[] = await validate(object);
        if (errors.length > 0) {
            throw new BadRequestException(`Validation failed: ${this.formatErrors(errors)}`);
        }
        return value;
    }

    private toValidate(metatype): boolean {
        const types = [String, Boolean, Number, Array, Object];
        return !types.includes(metatype);
    }

    private formatErrors(errors: any[]) {
        return errors
            .map(err => {
                for (const property in err.constraints) {
                    return err.constraints[property];
                }
            })
            .join(', ');
    }


    private isEmpty(value: any): boolean {
        return Object.keys(value).length === 0
    }
}