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
  
  const [nextPage, setNextPage] = useState(postsPagination.next_page)
  const [posts, setPosts] = useState<Post[]>(postsPagination.result)

  function handleShowMoreButton() {
    fetch(nextPage).then((response) => 
    response.json().then((json) => {
      const outPutNewPosts = {
        uid: json.results[0].uid,
        first_publication_date: new Date(json.results[0].last_publication_date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
        }),
        data: {
          title: RichText.asText(json.results[0].data.title),
          subtitle: RichText.asText(json.results[0].data.subtitle),
          author: RichText.asText(json.results[0].data.author),
        }
      }
      console.log(json.results[0])
      setPosts([...posts,outPutNewPosts])
      // setNextPage(json.results[0].next_page)
    }));
  }

  useEffect(() => {
    
  }, [posts,nextPage]);
  
  return (
    <>
      <Head>
        <title>Home | SpaceTraveling</title>
      </Head>
      <main>
        {posts.map(post => (
          <Link href={`/posts/${post.uid}`}>
            <a key={post.uid}>
                <time>{post.first_publication_date}</time>
                <p>{post.data.author}</p>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
            </a>
          </Link>
        ))}

        <button type="button" onClick={() => handleShowMoreButton()}>Mostrar mais</button>
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
    pageSize: 2,
    page: 1 
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
  });

  console.log(postsResponse)

  const next_page = postsResponse.next_page;
  
  return {
    props: {
      postsPagination: {
        result,
        next_page
      },
    },
    revalidate: 60*60*24, // 24 horas
  }
};

