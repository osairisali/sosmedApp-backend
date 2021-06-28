/* 
schema ini digunakan untuk menentukan jenis query dan model query yang akan dilakukan graphql 
*/

const { buildSchema } = require("graphql");

// hello adalah resolver dari resolvers.js, ini akan mengirimkan jenis data yg diminta oleh query
// tanda ! pada String menunjukkan bahwa jenis data yg diminta adalah String, jk tdk maka muncul error
module.exports = buildSchema(`

    type Post {
        _id: ID!
        title: String!
        content: String!
        imageUrl: String!
        creator: User!
        createdAt: String!
        updatedAt: String!
    }

    type User {
        _id : ID!
        name: String!
        email: String!
        password: String
        status: String!
        posts: [Post!]!
    }

    input UserInputData {
        email: String!
        name: String!
        password: String!
    }

    input PostInputData {
        title: String!
        imageUrl: String!
        content: String!
    }

    type AuthData {
        token: String!
        userId: String!
    }

    type RootMutation {
        createUser(userInput: UserInputData): User!
        createPost(postInput: PostInputData): Post!
        updatePost(id: ID!, postInput: PostInputData): Post!
        deletePost(id: ID!): Boolean
        updateStatus(status: String!): User!
    }

    type PostData {
        posts: [Post!]!
        totalPosts: Int!
    }

    type RootQuery {
        login(email: String!, password: String!): AuthData!
        posts(page: Int): PostData!
        post(id: ID!): Post!
        user: User!
    }

    schema {
        query: RootQuery
        mutation: RootMutation
    }
`);
