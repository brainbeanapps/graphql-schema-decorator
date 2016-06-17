import "reflect-metadata";
import * as assert from "assert";
import * as D from "./decorator";
import { schemaFactory , SchemaFactoryError , SchemaFactoryErrorType } from "./schema_factory";
import { clearObjectTypeRepository } from "./object_type_factory";

const graphql = require("graphql");
const parse = require("graphql/language").parse as (source: string) => any;
const validate = require("graphql/validation").validate as (schema: any, ast: any, ...args: any[]) => any[];
const execute = require("graphql/execution").execute as (schema: any, ast: any, ...args: any[]) => Promise<any>;

describe("schemaFactory", function() {
    beforeEach(function () {
        clearObjectTypeRepository();
    });

    it("throws an error with no @Query schema class", function() {
        @D.Schema() class Schema { }
        try {
            schemaFactory(Schema);
            assert(false, "Assertion Error");
        } catch (e) {
            const err = e as SchemaFactoryError;
            assert(err.type === SchemaFactoryErrorType.NO_QUERY_FIELD);
        }
    });

    it("throws an error with Schema class which has an invalid Query class", function() {
        class Query { }
        @D.Schema() class Schema { @D.Query() query: Query; }
        try {
            schemaFactory(Schema);
            assert(false, "Assertion Error");
        } catch (e) {
            const err = e as SchemaFactoryError;
            // console.log(err.stack);
            // TODO
        }
    });

    it("returns a GraphQL schema object which is executable", async function(done) {
        @D.ObjectType() class Query {
            @D.Field() title(): string { return "hello"; }
        }
        @D.Schema() class Schema { @D.Query() query: Query; }
        const schema = schemaFactory(Schema);
        const ast = parse(`query { title }`);
        const actual = await execute(schema, ast) as {data: {title: string}};
        assert(actual.data.title === "hello");
        done();
    });

    it("returns a GraphQL schema object which is executable", async function(done) {
        @D.ObjectType() class Query {
            @D.Field() twice( @D.Arg({name: "input"}) input: number): number {
                return input * 2;
            }
        }
        @D.Schema() class Schema { @D.Query() query: Query; }
        const schema = schemaFactory(Schema);
        const ast = parse(`query { twice(input: 1) }`);
        assert.deepEqual(validate(schema, ast), []);
        const actual = await execute(schema, ast) as {data: {twice: number}};
        assert(actual.data.twice === 2);
        done();
    });
});