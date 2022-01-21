import { GetStaticProps } from 'next';

import Prismic from '@prismicio/client';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { RichText } from 'prismic-dom';
import  Head  from 'next/head';
import Link from 'next/link'
import { useEffect, useState } from 'react';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string; 
  result: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  // const { next_page, result} = postsPagination
  return (
    <>
      <Head>
        <title>Home | SpaceTraveling</title>
      </Head>
      <main>
        {/* {posts.map(post => (
          <Link href={`/posts/${post.uid}`}>
            <a key={post.uid}>
                <time>{post.first_publication_date}</time>
                <p>{post.data.author}</p>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
            </a>
          </Link>
        )) */}
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ],{
    fetch: ['posts.title', 'posts.subtitle','posts.author'],
    pageSize: 1,
    page: 1,
  });

  const result = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: new Date(post.last_publication_date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }),
      data: {
        title: RichText.asText(post.data.title),
        subtitle: RichText.asText(post.data.subtitle),
        author: RichText.asText(post.data.author),
      }
    }
  })

  
  return {
    props: {
      postsPagination: {
        result,
      },
    },
    revalidate: 60*60*24, // 24 horas
  }
};

