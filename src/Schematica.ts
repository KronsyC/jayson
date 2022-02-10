import { BaseSchema } from "./lib/Schemas";
/**
 * This is the base class initialized by the user
 * Responsible for managing caching as well as the other utilities
 */

import Validator from "./lib/utilities/Validator/Validator";
import ERR_UNKNOWN_REF from "./errors/Schematica/ERR_UNKNOWN_REF";
import Encoder from "./lib/utilities/Encoder/Encoder";
import {
    GenericSchema as Schema,
    GenericSchemaTemplate as SchemaTemplate,
    Parser,
} from ".";
import newSchema from "./lib/Schemas";

const kValidator =      Symbol("Validator");
const kParser =         Symbol("Parser");
const kEncoder =        Symbol("Encoder");
const kSchemaRefStore = Symbol("Schema Store");

export default class Schematica {
    // Store the scemas with their refs
    [kSchemaRefStore]: Map<string, Schema> = new Map();

    // Define all the utilities provided by Schematica
    [kValidator]: Validator;
    [kEncoder]: Encoder;
    [kParser]: Parser;
    constructor() {
        this[kValidator] = new Validator();
        this[kEncoder] = new Encoder();
        this[kParser] = new Parser();
    }

    /**
     *
     * @param schema A schema strucure or a schema template
     * @description Create a schema and saves it
     */
    addSchema(schema: Schema): Schema;
    addSchema(template: SchemaTemplate): Schema;
    addSchema(schema: Schema | SchemaTemplate): Schema {
        // Instantiate a new Schema and return it
        let sc: Schema;
        if (schema instanceof BaseSchema) {
            sc = schema;
        } else {
            sc = this.createSchema(schema);
        }

        if (sc.name) {
            if (sc.name.includes(" ")) {
                throw (new Error(
                    "Schema names cannot contain whitespace"
                ).name = "ERR_INVALID_SCHEMA_REF");
            }
            this[kSchemaRefStore].set(sc.name, sc);
        }
        return sc;
    }
    /**
     *
     * @param schema The schema you want to create
     * @description Create a schema with the given template
     */
    createSchema(schema: SchemaTemplate): Schema {
        const sch = newSchema(schema, this[kSchemaRefStore]);
        if (sch.name) {
            this[kSchemaRefStore].set(sch.name, sch);
        }
        return sch;
    }
    getSchema(ref: string): Schema {
        const schema = this[kSchemaRefStore].get(ref);
        if (schema) {
            return schema;
        } else {
            throw new ERR_UNKNOWN_REF();
        }
    }

    /**
     *
     * @param schema The Schema to create a validator for
     * @description Build a Validator function for the provided Schema
     */
    buildValidator(schema: Schema): (data: unknown) => boolean;
    buildValidator(ref: string): (data: unknown) => boolean;
    buildValidator(arg: Schema | string): (data: unknown) => boolean {
        if (typeof arg === "string") {
            return this.buildValidator(this.getSchema(arg));
        } else if (arg instanceof BaseSchema) {
            return this[kValidator].build(arg);
        } else {
            throw (new Error(
                "The Argument passed to buildValidator was not a string or Schema"
            ).name = "ERR_INVALID_ARGS");
        }
    }

    buildSerializer(schema: Schema): (data: unknown) => string {
        return this[kEncoder].build(schema);
    }
}
